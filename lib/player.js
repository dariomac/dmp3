import osPlayerFactory from './os-players/index.js';
import meta from './metadata.js';
import { printer } from './printer.js';
import { createPlayState, createSong } from './typesFactory.js';
import lyrics from './lyrics.js';
import { stateManager } from './stateManager.js';
import analytics from './analytics.js';

const PREBUFFER_TIME = 30;

class Player {
  #osPlayer;
  #bufferingState;
  #currentState;
  #playedSongs;
  #intervalId;

  constructor() {
    this.#osPlayer = null;
    this.#bufferingState = null;
    this.#currentState = null;
    this.#playedSongs = [];
    this.#intervalId = null;
  }

  async _bufferNextSong() {
    try {
      this.#bufferingState = createPlayState(createSong(this.#currentState.next.path), this.#currentState.mode);
      this.#bufferingState.fullyPlayedDirs = this.#currentState.fullyPlayedDirs;
      this.#bufferingState.topLevelDir = this.#currentState.topLevelDir;

      this.#bufferingState = await this.setState(this.#bufferingState);

      if (this.#bufferingState) {
        console.log('Buffering: ', this.#bufferingState.playing.path);
        await meta.setMetadata(this.#bufferingState.playing);
      }
    } catch (err) {
      printer.printMsg(`Buffering is failing... ${err}`);
    }
  }

  async init({ src, mode, loglevel }) {
    this.#currentState = await this.setState(createPlayState(createSong(src), mode));

    this.#osPlayer = await osPlayerFactory.init({
      onSongEnds: async () => {
        this.#currentState = this.#bufferingState;

        try {
          await this.play();
        } catch (err) {
          printer.printMsg(`Playing after buffering is failing... ${err}`);
          this.next(true);
        }
      },
      loglevel
    });
  }

  async previous() {
    if (this.#playedSongs.length > 1) {
      const currentSong = this.#playedSongs.pop();
      const lastSong = this.#playedSongs.pop();

      this.#currentState.playing.path = lastSong;
      this.#currentState.next.path = currentSong;
      this.#currentState.playing.pid = 0;

      await this.play();
    }
  }

  async stop() {
    if (this.isPlaying()) {
      await this.#osPlayer.stop();
    }
  }

  async play(resume = false) {
    if (!this.#currentState) {
      printer.printEOS();
      await this.kill();
      process.exit();
    }

    await meta.setMetadata(this.#currentState.playing);
    this.#currentState.playing = await this.#osPlayer.play(this.#currentState.playing, resume);
    this.#currentState.playing.pid = this.#osPlayer.pid;

    if (!resume) {
      if (this.#playedSongs[this.#playedSongs.length - 1] !== this.#currentState.playing.path) {
        this.#playedSongs.push(this.#currentState.playing.path);
      }

      setTimeout(() => {
        printer.printSong(this.#currentState);
        analytics.trackSong(this.#currentState);
        lyrics.setLyrics(this.#currentState.playing);

        clearInterval(this.#intervalId);

        if (this.#currentState.playing.duration) {
          const timeout = Math.max(0, Math.ceil(this.#currentState.playing.durationInSec - PREBUFFER_TIME) * 1000);
          console.log(`Next song ${this.#currentState.playing.path} will be buffered in: ${timeout}ms`);
          this.#intervalId = setTimeout(() => this._bufferNextSong(), timeout);
        }
      }, 500);
    }

    return this.#currentState.playing;
  }

  async pause() {
    if (!this.isPlaying()) {
      return;
    }

    await this.#osPlayer.pause();
  }

  async next(andPlay = true) {
    this.#currentState.playing = this.#currentState.next;
    this.#currentState = await this.setState(this.#currentState);

    if (andPlay) {
      await this.play();
    }
  }

  async setState(state) {
    return await stateManager.setState(state);
  }

  getState() {
    return this.#currentState;
  }

  isPlaying() {
    return this.#osPlayer.isPlaying();
  }

  isPaused() {
    return this.#osPlayer.isPaused();
  }

  isStopped() {
    return this.#osPlayer.isStopped();
  }

  async kill() {
    await this.#osPlayer.kill();
  }
}

export const player = new Player();
