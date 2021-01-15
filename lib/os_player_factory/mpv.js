// where you import your packages
const mpvAPI = require('node-mpv');
// where you want to initialise the API
const mpv = new mpvAPI();

let _intervalId;
let _isPlaying = false;
let _isPaused = false;
let _stopCalled = true;

async function play(song, resume = false) {
  if (resume) {
    clearInterval(_intervalId);
    await mpv.resume();
    return song;
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
  _isPlaying = false;
  _isPaused = false;

  if (!_stopCalled) {
    _onDone();
  }
});

mpv.on('paused', () => {
  _isPlaying = false;
  _isPaused = true;
});

mpv.on('started', () => {
  _isPlaying = true;
  _isPaused = false;
  _stopCalled = false;
});

mpv.on('resumed', () => {
  _isPlaying = true;
  _isPaused = false;
});

async function beforeDoneHandler () {
  if (_onBeforeDone) {
    await _onBeforeDone();
  }
}

async function stop () { 
  _stopCalled = true;
  await mpv.stop();
}

async function pause() {
  await mpv.pause();
}

async function kill () {
  await mpv.quit();
}

module.exports = async ({onDone, onBeforeDone}) => 
{
  _onDone = onDone;
  _onBeforeDone = onBeforeDone;
  
  // This method is an exception, it does not return a Promise
  if (!mpv.isRunning()) {
    await mpv.start();
  }

  return {
    stop,
    play,
    pause,
    kill,
    isPlaying: () => _isPlaying,
    isPaused: () => _isPaused,
  }
}
