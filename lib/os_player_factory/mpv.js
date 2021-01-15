// where you import your packages
const mpvAPI = require('node-mpv');
// where you want to initialise the API
const mpv = new mpvAPI();

let _intervalId;

async function play(song, resume = false) {
  if (!mpv.isRunning()) {
    await mpv.start();
  }

  if (await mpv.isPaused()) {
    await mpv.resume();
  }
  else {
    await mpv.load(song.path, mode="replace");
  }

  song.pid = 134;

  if (song.duration) {
    _intervalId = setTimeout(beforeDoneHandler, Math.ceil(song.durationInSec-30)*1000)
  }

  return song;
}

mpv.on('stopped', () => {
  _onDone();
});

async function beforeDoneHandler () {
  if (_onBeforeDone) {
    await _onBeforeDone();
  }
}

async function stop () { 
  await mpv.stop();
}

function pause() {
  mpv.pause();
}

function kill () {
  mpv.quit();
}

module.exports = ({onDone, onBeforeDone}) => 
{
  _onDone = onDone;
  _onBeforeDone = onBeforeDone;
  return {
    stop,
    play,
    pause,
    kill
  }
}
