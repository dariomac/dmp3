export class OSPlayer {
  pid = 0;
  onSongEnds = () => {};
  loglevel = 0;

  constructor(args) {
    if (new.target === OSPlayer) {
      throw new TypeError('Cannot construct OSPlayer instances directly');
    }

    if (!args) {
      throw new Error('args must be provided');
    }
    if (!args.onSongEnds) {
      throw new Error('onSongEnds must be provided');
    }
    if (!args.loglevel) {
      throw new Error('loglevel must be provided');
    }

    this.onSongEnds = args.onSongEnds;
    this.loglevel = args.loglevel;
  }

  async play(song, resume = false) {
    throw new Error('play (song) method must be implemented');
  }

  async stop() {
    throw new Error('stop (void) method must be implemented');
  }

  async pause() {
    throw new Error('pause (void) method must be implemented');
  }

  async kill() {
    throw new Error('kill (void) method must be implemented');
  }

  async isStopped() {
    throw new Error('isStopped (boolean) method must be implemented');
  }

  async isPaused() {
    throw new Error('isPaused (boolean) method must be implemented');
  }

  async isPlaying() {
    throw new Error('isPlaying (boolean) method must be implemented');
  }

  async start() {
    throw new Error('start (void) method must be implemented');
  }
}
