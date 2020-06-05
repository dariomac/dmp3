const child_process = require('child_process');
const mp3Duration = require('mp3-duration');

let instance;
let _onDone;

function play(songPath) {
  // stop existing playback
  if (instance) {
    instance.kill();
  }
  if (!songPath) { return; }

  instance = child_process.spawn.apply(child_process, ['afplay', ['-q', '1', songPath]]);
  
  mp3Duration(songPath, function (err, duration) {
    if (err) return console.log(err.message);
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    console.log(`Your file is ${minutes}:${seconds} seconds long`);
  });

  console.log(`${instance.pid} - ${songPath}`)
  instance.stdout.pipe(process.stdout);
  instance.stderr.pipe(process.stderr);

  instance.once('exit', function(code) {
    var isError = (code !== 0 && code !== null),
    err = new Error('Child process exited with code ' + code);
    if (_onDone) {
      _onDone(isError ? err : null, songPath);
    }
  });
}

function pause () {

}

module.exports = ({onDone, onBeforeDone}) => 
{
  _onDone = onDone;
  return {
    play,
    pause
  }
}
