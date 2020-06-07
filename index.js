const commandLineArgs = require('command-line-args');
const player = require('./lib/player');
const listen = require('./lib/listen');
const printer = require('./lib/cmd_line_printer');
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
      playState = await player.getNext(playState);

      playState.playing.duration = '02:42';
      printer.print(opts, playState);
      
      const i = setInterval(async function(){
        playState.playing.path = playState.next.path;
        playState = await player.getNext(playState);
        
        if (!playState) {
          console.log('END PLAYING');
          clearInterval(i);
          return;
        }

        playState.playing.duration = '02:42';
        printer.print(opts, playState);

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
