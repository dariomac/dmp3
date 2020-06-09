const child_process = require('child_process');

let _instance;
let _onDone;

function play(song) {
  if (!song){
    _instance.kill('SIGCONT');
    return;
  }
  // stop existing playback
  if (_instance) {
    _instance.removeListener('exit', handler);
    _instance.kill();
  }

  _instance = child_process.spawn.apply(child_process, ['mpg123', ['-q', song.path]]);
  song.pid = _instance.pid;

  _instance.stdout.pipe(process.stdout);
  _instance.stderr.pipe(process.stderr);

  _instance.once('exit', handler);

  return song;
}

function handler (code) {
  var isError = (code !== 0 && code !== null),
  err = new Error('Child process exited with code ' + code);
  if (_onDone) {
    _onDone(isError ? err : null);
  }
}

function pause () {
  // https://www-uxsup.csx.cam.ac.uk/courses/moved.Building/signals.pdf
  _instance.kill('SIGSTOP');
}

function kill () {
  // https://www-uxsup.csx.cam.ac.uk/courses/moved.Building/signals.pdf
  _instance.kill('SIGHUP');
}

module.exports = ({onDone, onBeforeDone}) => 
{
  _onDone = onDone;
  return {
    play,
    pause,
    kill
  }
}
