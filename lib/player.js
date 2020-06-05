const fs = require('fs');
const fsx = require('fs-extra');
const path = require('path');
const osPlayerFactory = require('./os_player_factory');
const _ = require('lodash');
const escapeStringRegexp = require('escape-string-regexp');

let osPlayer;

async function _stat(path) {
  return await fsx.stat(path);
}

async function _readdir(path) {
  return await fsx.readdir(path);
}

async function getNext(playState) {
  playState.playing = path.resolve(playState.playing);
  
  // Initialize fullyPlayedDirs
  if (!playState.fullyPlayedDirs) {
    playState.fullyPlayedDirs = [];
  }
  
  const playingStat = await _stat(playState.playing);
  let dirname;
  if (playingStat.isFile()) {
    dirname = path.dirname(playState.playing);
  }
  else {
    dirname = playState.playing;
  }

  // Set toplevel directory
  playState = setToplevelDirectory(playState, playingStat.isFile());
  
  let items = await getPlayableItems(playState, dirname);
  
  if (items.length === 0) {
    pushAsPlayed(playState, dirname);
    
    return changeToPriorDirectory(playState, dirname);
  }

  let playingIdx = 0;
  if (playingStat.isDirectory()) {
    playState.playing = items[playingIdx];
    return await getNext(playState);
  }
  else {
    playingIdx = _.findIndex(items, function(item){
      return item === playState.playing;
    });
  }
  
  const nextIdx = playingIdx + 1;
  if (nextIdx < items.length) {
    playState.next = items[nextIdx];
    
    // If next seems to be a directory
    if (path.extname(playState.next) === ''){
      const nextStat = await _stat(playState.next);
      // If really is a directory
      if (nextStat.isDirectory()) {
        // Push current directory as played
        pushAsPlayed(playState, dirname);
      }
    }
  }
  else {
    pushAsPlayed(playState, dirname);
    playState = changeToPriorDirectory(playState, dirname);
  }
  
  return playState;
}

function setToplevelDirectory(playState, isFile) {
  if (!playState.topLevelDir){
    playState.topLevelDir = path.resolve(playState.playing);

    if (isFile) {
      playState.topLevelDir = path.dirname(playState.topLevelDir);
    }
  }
  return playState;
}

function pushAsPlayed(playState, dirname) {
  playState.fullyPlayedDirs.push(new RegExp(`^${escapeStringRegexp(dirname)}$`));
  playState.fullyPlayedDirs.push(new RegExp(`${escapeStringRegexp(dirname)}/[^\/]*\.mp3`));
}

function changeToPriorDirectory(playState, dirname) {
  const priorDirectory = path.resolve(dirname, '..');
  if (priorDirectory !== path.dirname(playState.topLevelDir)) {
    playState.next = priorDirectory;
    
    return playState;
  }
  else {
    return null;
  }
}

async function getPlayableItems(playState, dirname) {
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


function play (src) {
  osPlayer.play(src);
}

function pause () {
  osPlayer.pause();
}

async function init (opts) {
  let playState = await getNext({
    playing: opts.src
  });

  osPlayer = osPlayerFactory.init(
    {
      onDone: async (err, songPath) => {
        playState.playing = playState.next;
        playState = await getNext(playState);
        
        if (!playState) {
          console.log('END PLAYING');
          clearInterval(i);
          return;
        }

        play(playState.playing);
        console.log(`Play this song: ${playState.playing}`);
        console.log(`Next song: ${playState.next}\n`);

        if (!playState.next) {
          console.log('END PLAYING');
          clearInterval(i);
          return;
        }
      }, 
      onBeforeDone: function(){

      }
    });
  
  play(playState.playing);
  console.log(`Play this song: ${playState.playing}`);
  console.log(`Next song: ${playState.next}\n`);

  /*osPlayer.onBeforeDone = () => {
    
  };
  
  osPlayer.onDone = async (err, playing, isCancelled) => {
    playState.playing = playState.next;
    playState = await player.getNext(playState);
    
    if (!playState) {
      console.log('END PLAYING');
      clearInterval(i);
      return;
    }

    play(playState.playing);
    console.log(`Play this song: ${playState.playing}`);
    console.log(`Next song: ${playState.next}\n`);

    if (!playState.next) {
      console.log('END PLAYING');
      clearInterval(i);
      return;
    }
  };*/
}

module.exports = {
  init,
  play,
  pause,
  getNext
}
