
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
    durationInSec: 0,
    duration: undefined,
    tags: {},
    pid: 0
  }
}

module.exports = {
  PlayState,
  Song
}
