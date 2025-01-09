import readline from 'readline';
import beep from 'beepbeep';

import { printer } from './printer.js';
import lyrics from './lyrics.js';
import analytics from './analytics.js';

class KeyboardListener {
  #lastKeyPressed;
  #isKeyBeingProcessed;

  constructor() {
    this.#lastKeyPressed = null;
    this.#isKeyBeingProcessed = false;
  }

  async init(player) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', async (str, key) => {
      try {
        if (key.ctrl && key.name === 'c') {
          await player.stop();
          await player.kill();
          printer.printBye();
          process.exit();
        } else {
          if (this.#isKeyBeingProcessed) {
            beep();
            return;
          }

          this.#isKeyBeingProcessed = true;

          switch (key.name) {
            case 'h':
              printer.printHelp();
              break;
            case 'z':
              await player.previous();
              break;
            case 'x':
              await player.stop();
              break;
            case 'c':
              if (player.isPaused() || player.isStopped()) {
                await player.play(true);
              } else {
                await player.pause();
              }
              break;
            case 'v':
              await player.next();
              break;
            case 'd':
              printer.printDetails(player.getState());
              break;
            case 'l':
              printer.printLyrics(player.getState().playing);
              break;
            case 'o':
              printer.expand('Do you want to override this song lyrics with a newly download version? (y/n)');
              break;
            case 'p':
              printer.expand('Do you want to override this song lyrics with the content of the clipboard? (y/n)');
              break;
            case 'y':
              let fromClipboard = null;
              if (this.#lastKeyPressed === 'o') {
                fromClipboard = false;
              }
              if (this.#lastKeyPressed === 'p') {
                fromClipboard = true;
              }
              printer.collapse();
              await lyrics.override(player.getState().playing, fromClipboard);
              printer.printLyrics(player.getState().playing);
              break;
            case 'n':
              if (this.#lastKeyPressed === 'o') {
                printer.collapse();
              }
              break;
            case 'f':
              await analytics.favoriteSong(player.getState());
              printer.printMsg('Song marked as favorite\n');
              break;
            case 'q':
              await player.kill();
              printer.printBye();
              process.exit();
          }
          this.#isKeyBeingProcessed = false;
          this.#lastKeyPressed = key.name;
        }
      } catch (err) {
        player.kill();
        printer.printErr(err);
        process.exit();
      }
    });
  }
}

export const keyboardListener = new KeyboardListener();
