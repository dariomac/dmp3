const fs = require('fs');
const fsx = require('fs-extra');
const path = require('path');
const osPlayerFactory = require('./os_player_factory');
const _ = require('lodash');
const escapeStringRegexp = require('escape-string-regexp');
const meta = require('./metadata');
const printer = require('./cmd_line_printer');
const { PlayState, Song } = require('./domain');

let _osPlayer;
let _isPlaying = false;
let _playState = null;

async function _stat(path) {
  return await fsx.stat(path);
}

async function _readdir(path) {
  return await fsx.readdir(path);
}

function _setToplevelDirectory(playState, isFile) {
  if (!playState.topLevelDir){
    playState.topLevelDir = path.resolve(playState.playing.path);

    if (isFile) {
      playState.topLevelDir = path.dirname(playState.topLevelDir);
    }
  }
  return playState;
}

function _pushAsPlayed(playState, dirname) {
  playState.fullyPlayedDirs.push(new RegExp(`^${escapeStringRegexp(dirname)}$`));
  playState.fullyPlayedDirs.push(new RegExp(`${escapeStringRegexp(dirname)}/[^\/]*\.mp3`));
}

function _changeToPriorDirectory(playState, dirname) {
  const priorDirectory = path.resolve(dirname, '..');
  if (priorDirectory !== path.dirname(playState.topLevelDir)) {
    playState.next = Song(priorDirectory);
    
    return playState;
  }
  else {
    return null;
  }
}

async function _getPlayableItems(playState, dirname) {
  let items = _
    .filter((await _readdir(dirname)), function(item){
      return item !== '.DS_Store' && (path.extname(item) === '.mp3' || path.extname(item) === '');
    })
    .filter(function(item){
      let keep = _.reduce(_.values(playState.fullyPlayedDirs), function(acc, dirRegex){
        return acc && !dirRegex.test(path.resolve(dirname, item));
      }, true);

      return keep;
    })
    .sort(function(a, b){
      if (path.extname(a) === '.mp3' && path.extname(b) === ''){
        return -1;
      }

      if (path.extname(a) === '' && path.extname(b) === '.mp3'){
        return 1;
      }
      
      else {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      }
    })
    .map(function(item){
      return path.resolve(dirname, item);
    });

  return items;
}

async function getNext(playState) {
  playState.playing.path = path.resolve(playState.playing.path);
  
  const playingStat = await _stat(playState.playing.path);
  let dirname;
  if (playingStat.isFile()) {
    dirname = path.dirname(playState.playing.path);
  }
  else {
    dirname = playState.playing.path;
  }

  // Set toplevel directory
  playState = _setToplevelDirectory(playState, playingStat.isFile());
  
  let items = await _getPlayableItems(playState, dirname);
  
  if (items.length === 0) {
    _pushAsPlayed(playState, dirname);
    
    return _changeToPriorDirectory(playState, dirname);
  }

  let playingIdx = 0;
  if (playingStat.isDirectory()) {
    playState.playing.path = items[playingIdx];
    return await getNext(playState);
  }
  else {
    playingIdx = _.findIndex(items, function(item){
      return item === playState.playing.path;
    });
  }
  
  const nextIdx = playingIdx + 1;
  if (nextIdx < items.length) {
    playState.next = Song(items[nextIdx]);
    
    // If next seems to be a directory
    if (path.extname(playState.next.path) === ''){
      const nextStat = await _stat(playState.next.path);
      // If really is a directory
      if (nextStat.isDirectory()) {
        // Push current directory as played
        _pushAsPlayed(playState, dirname);
      }
    }
  }
  else {
    _pushAsPlayed(playState, dirname);
    playState = _changeToPriorDirectory(playState, dirname);
  }
  
  return playState;
}

async function play (song) {
  if (song) {
    song = _osPlayer.play(song);
    await meta.set(song);
  }
  else {
    // resume after pause
    song = _osPlayer.play();
  }

  _isPlaying = true;

  return song;
}

function pause () {
  _osPlayer.pause();

  _isPlaying = false;
}

function kill () {
  //osPlayer.stop();
  _osPlayer.kill();
}

async function init (opts) {
  _playState = PlayState(Song(opts.src));
  _playState = await getNext(_playState);

  _osPlayer = osPlayerFactory.init(
    {
      onDone: async (err, song) => {
        // Load next song
        _playState.playing = _playState.next;

        // Walk to next song
        _playState = await getNext(_playState);
        
        if (!_playState) {
          console.log('END PLAYING');
          return;
        }

        await play(_playState.playing);
        printer.printSong(opts, _playState);

        if (!_playState.next.path) {
          console.log('END PLAYING');
          return;
        }
      }, 
      onBeforeDone: function(){

      }
    });
  
  await play(_playState.playing);
  printer.printSong(opts, _playState);
}

function isPlaying () {
  return _isPlaying;
}

module.exports = {
  init,
  kill,
  play,
  pause,
  getNext,
  isPlaying
}
