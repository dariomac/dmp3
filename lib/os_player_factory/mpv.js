import mpvAPI from 'node-mpv';

const mpv = new mpvAPI({
  "audio_only": true,
  "auto_restart": false
});

const preloadStart = 30;

let _intervalId;
let _isStopped = true;
let _isPaused = false;
let _stopCalled = true;
let pid = 0;
let _onDone = null;
let _onBeforeDone = null;

async function play(song, resume = false) {
  if (resume) {
    clearInterval(_intervalId);
    _isPaused = false;
    _isStopped = false;
    
    await mpv.resume();

    return song;
  }
  else {
    await mpv.load(song.path, 'replace');
  }

  _isPaused = false;
  _isStopped = false;

  song.pid = pid;

  if (song.duration) {
    _intervalId = setTimeout(beforeDoneHandler, Math.ceil(song.durationInSec - preloadStart) * 1000)
  }

  return song;
}

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
  _isPaused = true;
  await mpv.pause();
}

async function kill () {
  if (mpv.isRunning()) {
    await mpv.quit();
  }
}

mpv.on('stopped', () => {
  _isStopped = true;

  if (!_stopCalled) {
    _onDone();
  }
});

mpv.on('paused', () => {
  _isPaused = true;
});

mpv.on('started', () => {
  _stopCalled = false;
  _isPaused = false;
  _isStopped = false;
});

mpv.on('resumed', () => {
  _isPaused = false;
});

mpv.on('quit', () => {
  console.log('quit');
  process.exit();
});

mpv.on('crashed', () => {
  console.error('crashed');
  process.exit();
});

export default async ({onDone, onBeforeDone}) => 
{
  _onDone = onDone;
  _onBeforeDone = onBeforeDone;
  
  // This method is an exception, it does not return a Promise
  if (!mpv.isRunning()) {
    await mpv.start();
    pid = mpv.mpvPlayer.pid;
  }

  return {
    stop,
    play,
    pause,
    kill,
    isStopped: () => _isStopped,
    isPaused: () => _isPaused,
    isPlaying: () => !_isStopped && !_isPaused
  }
}
