
function print (opts, playState) {
  console.log(`Play this song: ${playState.playing.path} - Duration ${playState.playing.duration}`);
  console.log(`Next song: ${playState.next.path}\n`);
}

module.exports = {
  print
}
