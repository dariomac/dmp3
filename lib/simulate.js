/**
 * This is to show the songs that would be played in a normal situation
 */

// TODO: WARNING - It's not ending with Ctrl-C, so be careful with the path where you start the simulation.

import { meta } from './metadata.js';
import { createSong, createPlayState } from './typesFactory.js';
import { stateManager } from './state-manager.js';
import { printer } from './printer.js';

export default async (opts) => {
  let playState = createPlayState(createSong(opts.src), opts.mode);
  playState = await setState(playState);

  await meta.setMetadata(playState.playing);
  printer.printSong(playState);

  const i = setInterval(async function(){
    playState.playing = playState.next;
    playState = await stateManager.setState(playState);
    
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
