const readline = require('readline');

module.exports = function(player) { 
  // https://thisdavej.com/making-interactive-node-js-console-apps-that-listen-for-keypress-events/
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  
  process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
      player.kill();
      console.log('\nBye!!!')
      process.exit();
    } else {
      switch (key.name) {
        case 'z': {
          // Previous
          break;
        };
        case 'x': {
          // Stop
          console.log(player.isPlaying())
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
          break;
        };
        case 'i': {
          process.stdin.setRawMode(false);
        }
      }
      console.log(`You pressed the "${str}" key`);
      console.log();
      console.log(key);
      console.log();
    }
  }); 
  
  //process.stdin.resume();
};
