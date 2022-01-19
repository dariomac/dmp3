/**
 * This is to show the songs that would be played in a normal situation
 */

// TODO: WARNING - It's not ending with Ctrl-C, so be careful with the path where you start the simulation.

import meta from './metadata.js';
import { Song, PlayState } from './types.js';
import { setState } from './stateManager.js';
import printer from './printer.js';

export default async (opts) => {
  let playState = PlayState(Song(opts.src));
  playState.mode = opts.mode;
  playState = await setState(playState);

  await meta.setMetadata(playState.playing);
  printer.printSong(playState);

  const i = setInterval(async function(){
    playState.playing = playState.next;
    playState = await setState(playState);
    
    if (!playState) {
      console.log('END PLAYING');
      clearInterval(i);
      return;
    }
    
    await meta.setMetadata(playState.playing);
    printer.printSong(playState);

    if (!playState.next.path) {
      console.log('END PLAYING');
      clearInterval(i);
      return;
    }
  }, 1000);
}
