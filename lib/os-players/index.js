// import afplay from './afplay.js';
// import mpg123 from './mpg123.js';
import { MPVPlayer } from './mpv.js';

export default {
  // init returns an instance of the generic player class
  init: async (args) => {
    if (process.platform == 'darwin') { //MacOS
      const player = new MPVPlayer(args);
      await player.start();
      
      return player;
    } 
    else if (process.platform == 'win32') { //Windows

    }
    else { //Linux

    }
  }
}

