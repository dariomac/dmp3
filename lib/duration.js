const mp3Duration = require('mp3-duration');

function str_pad_left(string,pad,length) {
  return (new Array(length+1).join(pad)+string).slice(-length);
}

async function set (song) {
  try {
    const durationInSec = await mp3Duration(song.path);
  
    const minutes = Math.floor(durationInSec / 60);
    const seconds = Math.floor(durationInSec % 60);
    const finalTime = str_pad_left(minutes,'0',2)+':'+str_pad_left(seconds,'0',2);
    song.duration = finalTime;
  }
  catch (err) {
    song.duration = err;
  }

  return song;
}

module.exports = {
  set
}
