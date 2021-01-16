const osPlayerFactory = require('./os_player_factory');
const meta = require('./metadata');
const printer = require('./cmd_line_printer');
const { PlayState, Song } = require('./types');
const lyrics = require('./lyrics');
const { setState } = require('./stateManager');

let _osPlayer;
let _playState = null;
let _playedSongs = [];

async function init (opts) {
  _playState = PlayState(Song(opts.src));
  _playState.mode = opts.mode;
  _playState = await setState(_playState);

  _osPlayer = await osPlayerFactory.init(
    {
      onDone: async (err) => {
        this.next();

        if (!_playState.next.path) {
          printer.printEOS();
          process.exit();
        }
      }, 
      onBeforeDone: async function(){
        try {
          await meta.setDuration(_playState.next);
        } catch (err) {
          //Nothing to see here... continue, continue...
        }
      }
    });
}

async function previous () {
  if (_playedSongs.length > 1) {
    const currentSong = _playedSongs.pop();
    const lastSong = _playedSongs.pop();

    _playState.playing.path = lastSong;
    _playState.next.path = currentSong;

    _playState.playing.pid = 0;
    await play();
  }
}

async function stop() {
  if (isPlaying()) {
    await _osPlayer.stop();
  }
}

async function play() {
  if (!_osPlayer.isPaused()) {
    await meta.setMetadata(_playState.playing);
    _playState.playing = await _osPlayer.play(_playState.playing);
    
    if (_playedSongs[_playedSongs.length - 1] !== _playState.playing.path) {
      _playedSongs.push(_playState.playing.path);
    }
    printer.printSong(_playState);
    
    await lyrics.setLyrics(_playState.playing);
  }
  else {
    // resume after pause
    _playState.playing = await _osPlayer.play(_playState.playing, true);
  }

  return _playState.playing;
}

function pause() {
  if (!isPlaying()) {
    return;
  }

  _osPlayer.pause();
}

async function next() {
  // Load next song
  _playState.playing = _playState.next;

  // Walk to next song
  _playState = await setState(_playState);

  if (!_playState) {
    printer.printEOS();
    process.exit();
  }

  return await play();
}

function getState() {
  return _playState;
}

function isPlaying () {
  return !isStopped() && !isPaused();
}

const isPaused = () => _osPlayer.isPaused();

const isStopped = () => _osPlayer.isStopped();

const kill = async () => await _osPlayer.kill();

module.exports = {
  init,
  previous,
  stop,
  play,
  pause,
  next,
  setState,
  getState,
  isPlaying,
  isPaused,
  isStopped,
  kill
}
