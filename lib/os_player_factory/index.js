const afplay = require('./afplay');
const mpg123 = require('./mpg123');
const mpv = require('./mpv');

module.exports = {
  init: (args) => {
    if (process.platform == 'darwin') { //MacOS
      return mpv(args);
    } 
    else if (process.platform == 'win32') { //Windows

    }
    else { //Linux

    }
  }
}
