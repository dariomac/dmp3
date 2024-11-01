import osPlayerFactory from './os_player_factory/index.js';
import meta from './metadata.js';
import printer from './printer.js';
import { createPlayState, createSong } from './types.js';
import lyrics from './lyrics.js';
import { stateManager } from './stateManager.js';
import analytics from './analytics.js';

let osPlayer;
let currentState = null;
const playedSongs = [];

const init = async (opts) => {
  currentState = createPlayState(createSong(opts.src), opts.mode);
  currentState = await setState(currentState);
  
  let bufferingState;

  osPlayer = await osPlayerFactory.init(
    {
      onBeforeDone: async () => {
        try {
          // Create state for the next song, but don't play it
          bufferingState = createPlayState(createSong(currentState.next.path), currentState.mode);
          
          bufferingState.fullyPlayedDirs = currentState.fullyPlayedDirs;
          bufferingState.topLevelDir = currentState.topLevelDir;

          // Walk to next song (start)
          bufferingState = await setState(bufferingState);

          if (bufferingState){
            console.log('Buffering: ', bufferingState.playing.path)
            await meta.setMetadata(bufferingState.playing);
          }
        } catch (err) {
          printer.printMsg(`Buffering is failing... ${err}`);
        }
      },
      onDone: async () => {
        currentState = bufferingState;

        try {
          await play();
        } catch (err) {
          printer.printMsg(`Playing after buffering is failing... ${err}`);
          this.next(true);
        }
      }
    });
}

const previous = async () => {
  if (playedSongs.length > 1) {
    const currentSong = playedSongs.pop();
    const lastSong = playedSongs.pop();

    currentState.playing.path = lastSong;
    currentState.next.path = currentSong;

    currentState.playing.pid = 0;
    await play();
  }
}

const stop = async () => {
  if (isPlaying()) {
    await osPlayer.stop();
  }
}

const play = async () => {
  if (!currentState) {
    printer.printEOS();
    await kill();
    process.exit();
  }
  if (!osPlayer.isPaused()) {
    if (!currentState.playing.metaLoaded) {
      meta.setMetadata(currentState.playing);
    }
    
    currentState.playing = await osPlayer.play(currentState.playing);
    
    if (playedSongs[playedSongs.length - 1] !== currentState.playing.path) {
      playedSongs.push(currentState.playing.path);
    }
    setTimeout(() => {
      analytics.trackSong(currentState);
      
      printer.printSong(currentState);

      lyrics.setLyrics(currentState.playing);
    }, 500);
  }
  else {
    // resume after pause
    currentState.playing = await osPlayer.play(currentState.playing, true);
  }

  return currentState.playing;
}

const pause = async () => {
  if (!isPlaying()) {
    return;
  }

  await osPlayer.pause();
}

const next = async (andPlay = true) => {
  // Load next song
  currentState.playing = currentState.next;

  // Walk to next song
  currentState = await setState(currentState);

  if (andPlay) {
    await play();
  }
}

const setState = async (state) => {
  return await stateManager.setState(state);
}

const getState = () => {
  return currentState;
}

const isPlaying = () => osPlayer.isPlaying();

const isPaused = () => osPlayer.isPaused();

const isStopped = () => osPlayer.isStopped();

const kill = async () => await osPlayer.kill();

export const player = {
  init,
  previous,

  stop,
  isStopped,
  play,
  isPlaying,
  pause,
  isPaused,
  
  next,
  setState,
  getState,
  kill
}
