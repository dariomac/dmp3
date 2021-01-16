const _ = require('lodash');
const escapeStringRegexp = require('escape-string-regexp');
const fsx = require('fs-extra');
const path = require('path');
const { Song } = require('./types');

async function _stat(path) {
  return await fsx.stat(path);
}

async function _readdir(path, options) {
  return await fsx.readdir(path, options);
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

function _pushFileAsPlayed(playState, dirname) {
  playState.fullyPlayedDirs.push(new RegExp(`^${escapeStringRegexp(dirname)}$`));
  playState.fullyPlayedDirs.push(new RegExp(`${escapeStringRegexp(dirname)}/[^\/]*\.mp3`));
}

function _pushDirAsPlayed(playState, dirname) {
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

async function _getPlayableDirs(playState, dirname) {
  let dirs = _
    .filter((await _readdir(playState.playing.path, { withFileTypes: true })), function (item) {
      return item.isDirectory();
    })
    .map(function(item){
      return path.resolve(dirname, item.name);
    })
    .filter(function(dir){
      let keep = _.reduce(_.values(playState.fullyPlayedDirs), function(acc, dirRegex){
        return acc && !dirRegex.test(path.resolve(dirname, dir));
      }, true);

      return keep;
    });

  return dirs;
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

async function _setRandomState(playState, items, playingStat, dirname, goDeep) {
  let playingIdx;
  if (playingStat.isDirectory()) {
    if (goDeep) {
      let dirs = await _getPlayableDirs(playState, dirname);

      if (dirs.length > 0) {
        items = dirs;
      }
    }

    playingIdx = _.random(0, items.length-1);
    playState.playing.path = items[playingIdx];
    
    return await _setState(playState);
  }
  else {
    playingIdx = _.findIndex(items, function(item){
      return item === playState.playing.path;
    });
    
    _pushFileAsPlayed(playState, playState.playing.path);
  }

  dirname = playState.topLevelDir;
  items = await _getPlayableItems(playState, dirname);
  
  if (items.length > 0) {
    const nextIdx = _.random(0, items.length-1);
    playState.next = Song(items[nextIdx]);
  }
  
  return playState;
}

async function _setSortedState(playState, items, playingStat, dirname) {
  let playingIdx;
  if (playingStat.isDirectory()) {
    playingIdx = 0;
    
    playState.playing.path = items[playingIdx];
    return await _setState(playState);
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
        _pushDirAsPlayed(playState, dirname);
      }
    }
  }
  else {
    _pushDirAsPlayed(playState, dirname);
    playState = _changeToPriorDirectory(playState, dirname);
  }
  
  return playState;
}

async function _setState(playState) {
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
    _pushDirAsPlayed(playState, dirname);
    
    return _changeToPriorDirectory(playState, dirname);
  }

  if (playState.mode === 'random') {
    return await _setRandomState(playState, items, playingStat, dirname, _.random(0,1));
  }
  else {
    return await _setSortedState(playState, items, playingStat, dirname);
  }
}

module.exports.setState = _setState;
