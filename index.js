const commandLineArgs = require('command-line-args');
const player = require('./lib/player');
const listen = require('./lib/listen');
const { Song, PlayState } = require('./lib/domain');

const optionDefinitions = [
  { name: 'mode', alias: 'm', type: String },
  { name: 'src', type: String, multiple: false, defaultOption: true },
  { name: 'simulate', alias: 's', type: Boolean },
];

const opts = commandLineArgs(optionDefinitions);

(async () => {
  if (! opts.src) {
    console.log('You must specify at least one path');
  }
  else {
    if (!opts.simulate) {
      await player.init(opts);

      listen(player);
    }
    else {
      let playState = PlayState(Song(opts.src));
      await player.getNext(playState);

      console.log(`Play this song: ${playState.playing.path}`);
      console.log(`Next song: ${playState.next.path}\n`);
      
      const i = setInterval(async function(){
        playState.playing.path = playState.next.path;
        playState = await player.getNext(playState);
        
        if (!playState) {
          console.log('END PLAYING');
          clearInterval(i);
          return;
        }

        console.log(`Play this song: ${playState.playing.path}`);
        console.log(`Next song: ${playState.next.path}\n`);

        if (!playState.next.path) {
          console.log('END PLAYING');
          clearInterval(i);
          return;
        }
      }, 250);
    }
  }
})().catch(e => {
  console.log(e)
  // Deal with the fact the chain failed
});
