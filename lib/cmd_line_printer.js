
function print (opts, playState) {
  console.log(`Play this song: ${playState.playing.path} - Duration ${playState.playing.duration}`);
  console.log(playState.playing.tags)
  console.log(`Next song: ${playState.next.path}\n`);
}

module.exports = {
  print
}
