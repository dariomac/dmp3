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
    _instance.kill();
  }

  _instance = child_process.spawn.apply(child_process, ['mpg123', ['-q', song.path]]);
  song.pid = _instance.pid;

  _instance.stdout.pipe(process.stdout);
  _instance.stderr.pipe(process.stderr);

  _instance.once('exit', function(code) {
    var isError = (code !== 0 && code !== null),
    err = new Error('Child process exited with code ' + code);
    if (_onDone) {
      _onDone(isError ? err : null, song);
    }
  });

  return song;
}

function pause () {
  _instance.kill('SIGSTOP');
}

function kill () {
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
