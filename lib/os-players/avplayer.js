import { OSPlayer } from './os-player.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class AVPlayer extends OSPlayer {
  #isStopped;
  #isPaused;
  #process;
  #ready;
  #readyPromise;
  #resolveReady;

  constructor(args) {
    super(args);

    this.#isStopped = true;
    this.#isPaused = false;
    this.#process = null;
    this.#ready = false;

    // Create a promise that resolves when the player is ready
    this.#readyPromise = new Promise((resolve) => {
      this.#resolveReady = resolve;
    });
  }

  async start() {
    if (this.#process) {
      return;
    }

    const playerPath = join(__dirname, 'avplayer-native', 'avplayer');

    this.#process = spawn(playerPath, [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.pid = this.#process.pid;

    // Handle stdout messages from the player
    this.#process.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const message = JSON.parse(line);
          this.#handleMessage(message);
        } catch (err) {
          if (this.loglevel > 0) {
            console.error('Failed to parse message from player:', line);
          }
        }
      }
    });

    // Handle stderr
    this.#process.stderr.on('data', (data) => {
      if (this.loglevel > 0) {
        console.error('AVPlayer error:', data.toString());
      }
    });

    // Handle process exit
    this.#process.on('exit', (code) => {
      if (this.loglevel > 0) {
        console.log('AVPlayer process exited with code:', code);
      }
      this.#process = null;
    });

    // Wait for the player to be ready
    await this.#readyPromise;
  }

  async play(song, resume = false) {
    if (!this.#process) {
      throw new Error('Player not started');
    }

    if (resume) {
      this.#sendCommand({ action: 'resume' });
    } else {
      this.#sendCommand({ action: 'play', path: song.path });
    }

    this.#isPaused = false;
    this.#isStopped = false;

    return song;
  }

  async stop() {
    if (!this.#process) {
      return;
    }

    this.#sendCommand({ action: 'stop' });
    this.#isStopped = true;
  }

  async pause() {
    if (!this.#process) {
      return;
    }

    this.#sendCommand({ action: 'pause' });
    this.#isPaused = true;
  }

  async kill() {
    if (this.#process) {
      this.#sendCommand({ action: 'quit' });

      // Give it a moment to quit gracefully
      await new Promise(resolve => setTimeout(resolve, 100));

      if (this.#process) {
        this.#process.kill();
      }
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

  #sendCommand(command) {
    if (this.#process && this.#process.stdin.writable) {
      this.#process.stdin.write(JSON.stringify(command) + '\n');
    }
  }

  #handleMessage(message) {
    switch (message.event) {
      case 'ready':
        this.#ready = true;
        if (this.#resolveReady) {
          this.#resolveReady();
        }
        if (this.loglevel > 0) {
          console.log('AVPlayer ready');
        }
        break;

      case 'playing':
        this.#isStopped = false;
        this.#isPaused = false;
        if (this.loglevel > 0) {
          console.log('AVPlayer started playing');
        }
        break;

      case 'paused':
        this.#isPaused = true;
        if (this.loglevel > 0) {
          console.log('AVPlayer paused');
        }
        break;

      case 'stopped':
        this.#isStopped = true;
        if (this.loglevel > 0) {
          console.log('AVPlayer stopped');
        }
        break;

      case 'finished':
        this.#isStopped = true;
        if (this.loglevel > 0) {
          console.log('AVPlayer finished playing');
        }
        this.onSongEnds();
        break;

      case 'error':
        console.error('AVPlayer error:', message.error);
        break;

      default:
        if (this.loglevel > 1) {
          console.log('Unknown message from player:', message);
        }
    }
  }
}
