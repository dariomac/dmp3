const readline = require('readline');
const printer = require('./cmd_line_printer');
const lyrics = require('./lyrics');

let lastKeyPressed = null;

module.exports = async function(player) { 
  // https://thisdavej.com/making-interactive-node-js-console-apps-that-listen-for-keypress-events/
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  
  process.stdin.on('keypress', async (str, key) => {
    try {
      if (key.ctrl && key.name === 'c') {
        await player.stop();
        
        // setTimeout(async () => { 
          await player.kill();

          printer.printBye();
          process.exit();
        // }, 1000);
      } else {        
        switch (key.name) {
          case 'z': {
            // Previous
            player.previous();
            break;
          };
          case 'x': {
            // Stop
            await player.stop();
            break;
          };
          case 'c': {
            // Pause/Play
            if (player.isPaused() || player.isStopped()) {
              await player.play();
            }
            else {
              player.pause();
            }
            break;
          };
          case 'v': {
            // Next
            player.next();
            break;
          };
          case 'd': {
            printer.printDetails(player.getState());
            break;
          };
          case 'l': {
            printer.printLyrics(player.getState().playing);
            break;
          };
          case 'o': {
            printer.expand('Do you want to override this song lyrics with a newly download version? (y/n)');
            break;
          };
          case 'p': {
            printer.expand('Do you want to override this song lyrics with the content of the clipboard? (y/n)');
            break;
          };
          case 'y': {
            let fromClipboard = null;
            if (lastKeyPressed === 'o') {
              fromClipboard = false;
            }
            if (lastKeyPressed === 'p') {
              fromClipboard = true;
            }
            await lyrics.override(player.getState().playing, fromClipboard);
            printer.collapse();

            printer.printLyrics(player.getState().playing);
            break;
          };
          case 'n': {
            if (lastKeyPressed === 'o') {
              printer.collapse();
            }
            break;
          };
          case 'i': {
            process.stdin.setRawMode(false);
          }
        }
        
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
