// import afplay from './afplay.js';
// import mpg123 from './mpg123.js';
import mpv from './mpv.js';

const os_player_interface = {
  play: async (song, resume = false) => {},
  stop: async () => {},
  pause: async () => {},
  kill: async () => {},

  isStopped: () => false,
  isPaused: () => false,
  isPlaying: () => true
};

export default {
  init: async (args) => {
    if (process.platform == 'darwin') { //MacOS
      return await mpv(args);
    } 
    else if (process.platform == 'win32') { //Windows

    }
    else { //Linux

    }
  }
}

