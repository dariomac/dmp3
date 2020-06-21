const readline = require('readline');
const printer = require('./cmd_line_printer');
const lyrics = require('./lyrics');

module.exports = function(player) { 
  // https://thisdavej.com/making-interactive-node-js-console-apps-that-listen-for-keypress-events/
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  
  process.stdin.on('keypress', (str, key) => {
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
            printer.printLyrics(lyrics.read(player.getState().playing));
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
