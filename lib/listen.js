const readline = require('readline');
const printer = require('./cmd_line_printer');
const lyrics = require('./lyrics');

let askForOverride = false;

module.exports = async function(player) { 
  // https://thisdavej.com/making-interactive-node-js-console-apps-that-listen-for-keypress-events/
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  
  process.stdin.on('keypress', async (str, key) => {
    try {
      if (key.ctrl && key.name === 'c') {
        player.stop();
        printer.printBye();
        process.exit();
      } else {        
        switch (key.name) {
          case 'z': {
            // Previous
            player.previous();
            break;
          };
          case 'x': {
            // Stop
            player.stop();
            break;
          };
          case 'c': {
            // Pause/Play
            if (player.isPlaying()) {
              player.pause();
            }
            else {
              player.play();
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
          }
          case 'l': {
            printer.printLyrics(player.getState().playing);
            break;
          }
          case 'o': {
            askForOverride = true;
            printer.expand('Do you want to override this song lyrics with the content of the clipboard? (y/n)');
            break;
          }
          case 'y': {
            if (askForOverride) {
              await lyrics.override(player.getState().playing);
              printer.collapse();
              askForOverride = false;
              
              printer.printLyrics(player.getState().playing);
            }
            break;
          }
          case 'n': {
            if (askForOverride) {
              printer.collapse();
              askForOverride = false;
            }
            break;
          }
          case 'i': {
            process.stdin.setRawMode(false);
          }
        }
      }
    }
    catch (err) {
      player.stop();
      printer.printErr(err);
      process.exit();
    }
  }); 
  
  //process.stdin.resume();
};
