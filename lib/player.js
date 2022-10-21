import osPlayerFactory from './os_player_factory/index.js';
import meta from './metadata.js';
import printer from './printer.js';
import { PlayState, Song } from './types.js';
import lyrics from './lyrics.js';
import { setState } from './stateManager.js';
import analytics from './analytics.js';

let _osPlayer;
let _playState = null;
let _playedSongs = [];

async function init (opts) {
  _playState = PlayState(Song(opts.src));
  _playState.mode = opts.mode;
  _playState = await setState(_playState);
  let _bufferingState;

  _osPlayer = await osPlayerFactory.init(
    {
      onBeforeDone: async () => {
        try {
          // Move to next song but don't play it
          _bufferingState = PlayState(Song(_playState.next.path));
          _bufferingState.fullyPlayedDirs = _playState.fullyPlayedDirs;
          _bufferingState.topLevelDir = _playState.topLevelDir;
          _bufferingState.mode = _playState.mode;

          // Walk to next song
          _bufferingState = await setState(_bufferingState);

          if (_bufferingState){
            console.log('Buffering: ', _bufferingState.playing.path)
            await meta.setMetadata(_bufferingState.playing);
          }
        } catch (err) {
          printer.printMsg(`Buffering is failing... ${err}`);
        }
      },
      onDone: async () => {
        _playState = _bufferingState;

        try {
          await this.play();
        } catch (err) {
          printer.printMsg(`Playing after buffering is failing... ${err}`);
          this.next(true);
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
    analytics.trackSong(_playState);
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

const isPlaying = () => _osPlayer.isPlaying();

const isPaused = () => _osPlayer.isPaused();

const isStopped = () => _osPlayer.isStopped();

const kill = async () => await _osPlayer.kill();

export default {
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
