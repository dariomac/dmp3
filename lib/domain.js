
function PlayState (playingSong) {
  return {
    playing: playingSong,
    next: {},
    fullyPlayedDirs: [],
    topLevelDir: ''
  }
}

function Song (path) {
  return {
    path,
    duration: undefined,
    tags: {},
    pid: 0
  }
}

module.exports = {
  PlayState,
  Song
}
