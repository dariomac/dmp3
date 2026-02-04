import { OSPlayer } from './os-player.js';
import mpvAPI from 'node-mpv';

// You should add this dependency to your package.json
// "node-mpv": "git@github.com:dariomac/node-mpv.git"

const EVENTS = {
  STOPPED: 'stopped',
  STATUS: 'status',
  STARTED: 'started',
  QUIT: 'quit',
  CRASHED: 'crashed'
};

export class MPVPlayer extends OSPlayer {
  #isStopped;
  #isPaused;
  #stopCalled;
  #mpv;

  constructor(args) {
    super(args);
    
    this.#isStopped = true;
    this.#isPaused = false;
    this.#stopCalled = true;

    this.#mpv = new mpvAPI({
      audio_only: true,
      auto_restart: false,
      verbose: this.loglevel > 0,
      debug: this.loglevel === 4,
    });

    this._initializeEvents();
  }

  _initializeEvents() {
    this.#mpv.on(EVENTS.STARTED, this.#handleStarted.bind(this));
    this.#mpv.on(EVENTS.STATUS, this.#handleStatus.bind(this));
    this.#mpv.on(EVENTS.STOPPED, this.#handleStopped.bind(this));
    this.#mpv.on(EVENTS.QUIT, this.#handleQuit.bind(this));
    this.#mpv.on(EVENTS.CRASHED, this.#handleCrashed.bind(this));
  }

  async start() {
    if (!this.#mpv.isRunning()) {
      await this.#mpv.start();
      this.pid = this.#mpv.mpvPlayer.pid;
    }
  }

  async play(song, resume = false) {
    if (resume) {
      await this.#mpv.resume();
    } else {
      await this.#mpv.load(song.path, 'replace');
    }

    this.#isPaused = false;
    this.#isStopped = false;

    return song;
  }

  async stop() {
    this.#stopCalled = true;
    await this.#mpv.stop();
  }

  async pause() {
    this.#isPaused = true;
    await this.#mpv.pause();
  }

  async kill() {
    if (this.#mpv.isRunning()) {
      await this.#mpv.quit();
    }
  }

  isStopped() {
    return this.#isStopped;
  }

  isPaused() {
    return this.#isPaused;
  }

  isPlaying() {
    return !(this.#isStopped || this.#isPaused);
  }

  #handleStopped() {
    this.#isStopped = true;
    if (!this.#stopCalled) {
      this.onSongEnds();
    }
  }

  #handleStatus({ property, value }) {
    if (property === 'pause') {
      this.#isPaused = value;
    }
  }

  #handleStarted() {
    this.#stopCalled = false;
    this.#isPaused = false;
    this.#isStopped = false;
  }

  #handleQuit() {
    console.log('quit');
    process.exit();
  }

  #handleCrashed() {
    console.error('crashed');
    process.exit();
  }
}
