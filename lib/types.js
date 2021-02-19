const Tree = require('radix-tree').Tree

function PlayState (playingSong) {
  return {
    playing: playingSong,
    next: {},
    //fullyPlayedDirs: [],
    fullyPlayedDirs: new Tree(),
    topLevelDir: '',
    mode: ''
  }
}

function Song (path) {
  return {
    path,
    durationInSec: 0,
    duration: undefined,
    tags: {
      album: undefined,
      artist: undefined,
      genre: undefined,
      title: undefined,
      track: 0
    },
    pid: 0,
    rawMetadata: undefined,
    lyrics: {
      words: undefined,
      local: false
    },
    metaLoaded: false,
  }
}

module.exports = {
  PlayState,
  Song
}
