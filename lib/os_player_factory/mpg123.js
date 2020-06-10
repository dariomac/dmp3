const child_process = require('child_process');

let _instance;
let _onDone;
let _onBeforeDone;
let _intervalId;

function play(song, resume = false) {
  if (resume){
    clearInterval(_intervalId);
    _instance.kill('SIGCONT');
    return song;
  }
  // stop existing playback
  if (_instance) {
    clearInterval(_intervalId);
    _instance.removeListener('exit', exitHandler);
    _instance.kill();
  }

  _instance = child_process.spawn.apply(child_process, ['mpg123', ['-q', song.path]]);
  song.pid = _instance.pid;

  _instance.stdout.pipe(process.stdout);
  _instance.stderr.pipe(process.stderr);

  _instance.once('exit', exitHandler);
  if (song.duration) {
    _intervalId = setTimeout(beforeDoneHandler, Math.ceil(song.durationInSec-30)*1000)
  }

  return song;
}

async function beforeDoneHandler () {
  if (_onBeforeDone) {
    await _onBeforeDone();
  }
}

async function exitHandler (code) {
  clearInterval(_intervalId);
  var isError = (code !== 0 && code !== null),
  err = new Error('Child process exited with code ' + code);
  if (_onDone) {
    await _onDone(isError ? err : null);
  }
}

function pause () {
  // https://www-uxsup.csx.cam.ac.uk/courses/moved.Building/signals.pdf
  _instance.kill('SIGSTOP');
}

function kill () {
  clearInterval(_intervalId);
  // https://www-uxsup.csx.cam.ac.uk/courses/moved.Building/signals.pdf
  _instance.kill('SIGHUP');
}

module.exports = ({onDone, onBeforeDone}) => 
{
  _onDone = onDone;
  _onBeforeDone = onBeforeDone;
  return {
    play,
    pause,
    kill
  }
}
