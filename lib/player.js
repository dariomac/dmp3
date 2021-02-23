const osPlayerFactory = require('./os_player_factory');
const meta = require('./metadata');
const printer = require('./printer');
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
      onBeforeDone: async () => {
        try {
          // Move to next song but don't play it
          await this.next(false);

          if (_playState){
            await meta.setMetadata(_playState.playing);
          }
        } catch (err) {
          printer.printMsg(`Buffering is failing... ${err}`);
        }
      },
      onDone: async () => {
        // Next was execute onBeforeDone
        await this.play();
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
  if (!_playState) {
    printer.printEOS();
    await kill();
    process.exit();
  }

  if (!_osPlayer.isPaused()) {
    if (!_playState.playing.metaLoaded) {
      meta.setMetadata(_playState.playing);
    }
    
    _playState.playing = await _osPlayer.play(_playState.playing);
    
    if (_playedSongs[_playedSongs.length - 1] !== _playState.playing.path) {
      _playedSongs.push(_playState.playing.path);
    }
    printer.printSong(_playState);
    
    lyrics.setLyrics(_playState.playing);
  }
  else {
    // resume after pause
    _playState.playing = await _osPlayer.play(_playState.playing, true);
  }

  return _playState.playing;
}

async function pause() {
  if (!isPlaying()) {
    return;
  }

  await _osPlayer.pause();
}

async function next(andPlay = true) {
  // Load next song
  _playState.playing = _playState.next;

  // Walk to next song
  _playState = await setState(_playState);

  if (andPlay) {
    await play();
  }
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
