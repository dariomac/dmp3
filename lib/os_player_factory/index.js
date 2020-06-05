const afplay = require('./afplay');

module.exports = {
  init: (args) => {
    if (process.platform == 'darwin') { //MacOS
      return afplay(args);
    } 
    else if (process.platform == 'win32') { //Windows

    }
    else { //Linux

    }
  }
}
