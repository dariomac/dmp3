const mp3Duration = require('mp3-duration');
const id3 = require('node-id3');

function _str_pad_left(string,pad,length) {
  return (new Array(length+1).join(pad)+string).slice(-length);
}

async function setDuration (song) {
  try {
    const durationInSec = await mp3Duration(song.path);
  
    const minutes = Math.floor(durationInSec / 60);
    const seconds = Math.floor(durationInSec % 60);
    const finalTime = _str_pad_left(minutes,'0',2)+':'+_str_pad_left(seconds,'0',2);
    song.durationInSec = durationInSec;
    song.duration = finalTime;
  }
  catch (err) {
    song.duration = err.toString();
  }

  return song;
}

function setTags (song) {
  try{
    song.tags = id3.read(song.path);
  }
  catch (err) {
    song.tags = { err };
  }

  return song;
}

module.exports = {
  setDuration,
  setTags
}
