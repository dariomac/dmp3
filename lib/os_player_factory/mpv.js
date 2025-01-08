import mpvAPI from 'node-mpv';

let mpv = null;

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
    // clearInterval(_intervalId);
    _isPaused = false;
    _isStopped = false;
    
    await mpv.resume();

    return song;
  }
  else {
    clearInterval(_intervalId);
    await mpv.load(song.path, 'replace');
  }

  _isPaused = false;
  _isStopped = false;

  song.pid = pid;

  if (song.duration && !_intervalId) {
    _intervalId = setTimeout(_onBeforeDone, Math.ceil(song.durationInSec - preloadStart) * 1000)
  }

  return song;
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

export default async ({onDone, onBeforeDone, loglevel}) => 
{
  if (!onDone || !onBeforeDone) {
    throw new Error('onDone and onBeforeDone must be provided');
  }

  _onDone = onDone;
  _onBeforeDone = onBeforeDone;

  mpv = new mpvAPI({
    "audio_only": true,
    "auto_restart": false,
    "verbose": loglevel > 0,
    "debug": loglevel === 4,
  });

  mpv.on('stopped', () => {
    _isStopped = true;
  
    // If stop was called manually, we don't want to call onDone
    if (!_stopCalled) {
      _onDone();
    }
  });
  
  mpv.on('status', ({property, value}) => {
    if (property === 'pause') {
      if (value === true) {
        _isPaused = true;
      } else {
        _isPaused = false;
      }
    }
  });
  
  mpv.on('started', () => {
    _stopCalled = false;
    _isPaused = false;
    _isStopped = false;
  });
  
  mpv.on('quit', () => {
    console.log('quit');
    process.exit();
  });
  
  mpv.on('crashed', () => {
    console.error('crashed');
    process.exit();
  });  
  
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
