import osPlayerFactory from './os_player_factory/index.js';
import meta from './metadata.js';
import printer from './printer.js';
import { createPlayState, createSong } from './types.js';
import lyrics from './lyrics.js';
import * as stateMgr from './stateManager.js';
import analytics from './analytics.js';

let osPlayer;
let playState = null;
const playedSongs = [];

const init = async (opts) => {
  playState = createPlayState(createSong(opts.src), opts.mode);
  playState = await setState(playState);
  let bufferingState;

  osPlayer = await osPlayerFactory.init(
    {
      onBeforeDone: async () => {
        try {
          // Move to next song but don't play it
          bufferingState = createPlayState(createSong(playState.next.path));
          bufferingState.fullyPlayedDirs = playState.fullyPlayedDirs;
          bufferingState.topLevelDir = playState.topLevelDir;
          bufferingState.mode = playState.mode;

          // Walk to next song
          bufferingState = await setState(bufferingState);

          if (bufferingState){
            console.log('Buffering: ', bufferingState.playing.path)
            await meta.setMetadata(bufferingState.playing);
          }
        } catch (err) {
          printer.printMsg(`Buffering is failing... ${err}`);
        }
      },
      onDone: async () => {
        playState = bufferingState;

        try {
          await this.play();
        } catch (err) {
          printer.printMsg(`Playing after buffering is failing... ${err}`);
          this.next(true);
        }
      }
    });
}

const previous = async () => {
  if (playedSongs.length > 1) {
    const currentSong = playedSongs.pop();
    const lastSong = playedSongs.pop();

    playState.playing.path = lastSong;
    playState.next.path = currentSong;

    playState.playing.pid = 0;
    await play();
  }
}

const stop = async () => {
  if (isPlaying()) {
    await osPlayer.stop();
  }
}

const play = async () => {
  if (!playState) {
    printer.printEOS();
    await kill();
    process.exit();
  }

  if (!osPlayer.isPaused()) {
    if (!playState.playing.metaLoaded) {
      meta.setMetadata(playState.playing);
    }
    
    playState.playing = await osPlayer.play(playState.playing);
    
    if (playedSongs[playedSongs.length - 1] !== playState.playing.path) {
      playedSongs.push(playState.playing.path);
    }
    analytics.trackSong(playState);
    printer.printSong(playState);
    
    lyrics.setLyrics(playState.playing);
  }
  else {
    // resume after pause
    playState.playing = await osPlayer.play(playState.playing, true);
  }

  return playState.playing;
}

const pause = async () => {
  if (!isPlaying()) {
    return;
  }

  await osPlayer.pause();
}

const next = async (andPlay = true) => {
  // Load next song
  playState.playing = playState.next;

  // Walk to next song
  playState = await setState(playState);

  if (andPlay) {
    await play();
  }
}

const setState = async (state) => {
  return await stateMgr.setState(state);
}

const getState = () => {
  return playState;
}

const isPlaying = () => osPlayer.isPlaying();

const isPaused = () => osPlayer.isPaused();

const isStopped = () => osPlayer.isStopped();

const kill = async () => await osPlayer.kill();

export const player = {
  init,
  previous,
  stop,
  play,
  pause,
  next,
  setState,
  getState,
  isPlaying,
  isPaused,
  isStopped,
  kill
}
