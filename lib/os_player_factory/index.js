import afplay from './afplay.js';
import mpg123 from './mpg123.js';
import mpv from './mpv.js';

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
