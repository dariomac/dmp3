import radixTree from 'radix-tree';

const Tree = radixTree.Tree;

export function PlayState (playingSong) {
  return {
    playing: playingSong,
    next: {},
    fullyPlayedDirs: new Tree(),
    topLevelDir: '',
    mode: ''
  }
}

export function Song (path) {
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
