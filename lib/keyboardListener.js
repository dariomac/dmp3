import readline from 'readline';
import beep from 'beepbeep';

import * as printer from './printer.js';
import lyrics from './lyrics.js';
import analytics from './analytics.js';

let lastKeyPressed = null;
let isKeyBeingProcessed = false;

const init = async (player) => { 
  // https://thisdavej.com/making-interactive-node-js-console-apps-that-listen-for-keypress-events/
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
        if (isKeyBeingProcessed) {
          beep();
          return;
        }
        
        isKeyBeingProcessed = true;

        switch (key.name) {
          // Help
          case 'h': {
            printer.printHelp();
            break;
          };

          // Previous
          case 'z': {
            await player.previous();
            break;
          };
          // Stop
          case 'x': {
            await player.stop();
            break;
          };
          // Pause/Play
          case 'c': {
            if (player.isPaused() || player.isStopped()) {
              await player.play(true);
            }
            else {
              await player.pause();
            }
            break;
          };
          // Next
          case 'v': {
            await player.next();
            break;
          };

          // Details
          case 'd': {
            printer.printDetails(player.getState());
            break;
          };
          // Show lyrics
          case 'l': {
            printer.printLyrics(player.getState().playing);
            break;
          };

          // Download and override lyrics
          case 'o': {
            printer.expand('Do you want to override this song lyrics with a newly download version? (y/n)');
            break;
          };
          // Paste from clipboard overriding lyrics
          case 'p': {
            printer.expand('Do you want to override this song lyrics with the content of the clipboard? (y/n)');
            break;
          };

          // Answer yes to a prompt
          case 'y': {
            let fromClipboard = null;
            if (lastKeyPressed === 'o') {
              fromClipboard = false;
            }
            if (lastKeyPressed === 'p') {
              fromClipboard = true;
            }
            printer.collapse();
            await lyrics.override(player.getState().playing, fromClipboard);

            printer.printLyrics(player.getState().playing);
            break;
          };
          // Answer no to a prompt
          case 'n': {
            if (lastKeyPressed === 'o') {
              printer.collapse();
            }
            break;
          };

          // Mark this track as favorite
          case 'f': {
            await analytics.favoriteSong(player.getState());
            printer.printMsg('Song marked as favorite\n');
            break;
          };
          
          // Quit
          case 'q': {
            await player.kill();
            printer.printBye();
            process.exit();
          };
          // case 'i': {
          //   process.stdin.setRawMode(false);
          // }
        }
        isKeyBeingProcessed = false;
        lastKeyPressed = key.name;
      }
    }
    catch (err) {
      player.kill();
      printer.printErr(err);
      process.exit();
    }
  });
};

export const keyboardListener = {
  init
}
