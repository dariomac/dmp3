const readline = require('readline');
const printer = require('./cmd_line_printer');

module.exports = function(player) { 
  // https://thisdavej.com/making-interactive-node-js-console-apps-that-listen-for-keypress-events/
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  
  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      player.stop();
      printer.printBye();
      process.exit();
    } else {
      switch (key.name) {
        case 'z': {
          // Previous
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
        case 'i': {
          process.stdin.setRawMode(false);
        }
      }
    }
  }); 
  
  //process.stdin.resume();
};
