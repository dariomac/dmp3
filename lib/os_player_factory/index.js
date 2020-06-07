const afplay = require('./afplay');
const mpg123 = require('./mpg123');

module.exports = {
  init: (args) => {
    if (process.platform == 'darwin') { //MacOS
      return mpg123(args);
    } 
    else if (process.platform == 'win32') { //Windows

    }
    else { //Linux

    }
  }
}
