import _ from 'lodash';
import fsx from 'fs-extra';
import path from 'path';

import { customReplacer } from './printer.js';
import { createSong } from './types.js';
import { randomInt } from './random.js';

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

function _pushFileAsPlayed(playState, filePath) {
  playState.fullyPlayedDirs.add(filePath);
}

function _pushDirAsPlayed(playState, dirPath) {
  playState.fullyPlayedDirs.add(dirPath);
}

function _changeToPriorDirectory(playState, dirname) {
  const priorDirectory = path.resolve(dirname, '..');
  if (priorDirectory !== path.dirname(playState.topLevelDir)) {
    playState.next = createSong(priorDirectory);
    
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
      let keep = !playState.fullyPlayedDirs.find(path.resolve(dirname, dir));

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
      let keep = !playState.fullyPlayedDirs.find(path.resolve(dirname, item));

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
  if (playingStat.isDirectory()) {
    if (goDeep) {
      let dirs = await _getPlayableDirs(playState, dirname);

      if (dirs.length > 0) {
        items = dirs;
      }
    }

    const playingIdx = await randomInt(0, items.length-1);
    playState.playing.path = items[playingIdx];
    
    const res = await setState(playState);
    if (res) {
      console.debug('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
      console.debug('Playing:', res.playing.path);
      console.debug('Next: ', res.next.path);
      console.debug('FullyPlayed:', JSON.stringify(res.fullyPlayedDirs, customReplacer, 2));
    }
    return res;
  }
  else {
    _pushFileAsPlayed(playState, playState.playing.path);
  }

  // Now that I know what to play, lets figure it out next one
  dirname = playState.topLevelDir;
  items = await _getPlayableItems(playState, dirname);
  
  if (items.length > 0) {
    const nextIdx = _.random(0, items.length-1);
    playState.next = createSong(items[nextIdx]);
  }
  
  return playState;
}

async function _setSortedState(playState, items, playingStat, dirname) {
  let playingIdx;
  if (playingStat.isDirectory()) {
    playingIdx = 0;
    
    playState.playing.path = items[playingIdx];
    return await setState(playState);
  }
  else {
    playingIdx = _.findIndex(items, function(item){
      return item === playState.playing.path;
    });
  }
  
  const nextIdx = playingIdx + 1;
  if (nextIdx < items.length) {
    playState.next = createSong(items[nextIdx]);
    
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

async function setState(playState) {
  console.debug('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  console.debug('Playing: ', playState.playing.path);
  console.debug('Next: ', playState.next.path);
  console.debug('FullyPlayed: ', JSON.stringify(playState.fullyPlayedDirs, customReplacer, 2));
  
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
    
    playState = _changeToPriorDirectory(playState, dirname);
  }
  else {
    if (playState.mode === 'random') {
      playState = await _setRandomState(playState, items, playingStat, dirname, _.random(0,1));
    }
    else {
      playState = await _setSortedState(playState, items, playingStat, dirname);
    }
  }
  if (playState && path.extname(playState.playing.path) === ''){
    playState.playing = playState.next;
    playState = setState(playState);
  }

  return playState;
}

export const stateManager = {
  setState
};
