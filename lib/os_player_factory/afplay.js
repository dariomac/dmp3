const child_process = require('child_process');
const mp3Duration = require('mp3-duration');

let _instance;
let _onDone;

function play(songPath) {
  if (!songPath){
    // https://apple.stackexchange.com/a/87485
    _instance.kill('SIGTSTP');
    return;
  }
  // stop existing playback
  if (_instance) {
    _instance.kill();
  }
  if (!songPath) { return; }

  _instance = child_process.spawn.apply(child_process, ['afplay', ['-q', '1', songPath]]);
  
  mp3Duration(songPath, function (err, duration) {
    if (err) return console.log(err.message);
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    console.log(`Your file is ${minutes}:${seconds} seconds long`);
  });

  console.log(`${_instance.pid} - ${songPath}`)
  _instance.stdout.pipe(process.stdout);
  _instance.stderr.pipe(process.stderr);

  _instance.once('exit', function(code) {
    var isError = (code !== 0 && code !== null),
    err = new Error('Child process exited with code ' + code);
    if (_onDone) {
      _onDone(isError ? err : null, songPath);
    }
  });
}

function pause () {
  // https://apple.stackexchange.com/a/87485
  _instance.kill('SIGCONT');
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
