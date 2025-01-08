import osPlayerFactory from './os_player_factory/index.js';
import meta from './metadata.js';
import * as printer from './printer.js';
import { createPlayState, createSong } from './typesFactory.js';
import lyrics from './lyrics.js';
import { stateManager } from './stateManager.js';
import analytics from './analytics.js';

let osPlayer;
let currentState = null;
const playedSongs = [];

export const init = async ({src, mode, loglevel}) => {
  currentState = await setState(
    createPlayState(createSong(src), mode)
  );
  
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
      },
      loglevel
    });
}

export const previous = async () => {
  if (playedSongs.length > 1) {
    const currentSong = playedSongs.pop();
    const lastSong = playedSongs.pop();

    currentState.playing.path = lastSong;
    currentState.next.path = currentSong;
    currentState.playing.pid = 0;

    await play();
  }
}

export const stop = async () => {
  if (isPlaying()) {
    await osPlayer.stop();
  }
}

export const play = async (resume = false) => {
  if (!currentState) {
    printer.printEOS();
    await kill();
    process.exit();
  }

  
  await meta.setMetadata(currentState.playing);
  currentState.playing = await osPlayer.play(currentState.playing, resume);

  if (!resume) {
    if (playedSongs[playedSongs.length - 1] !== currentState.playing.path) {
      playedSongs.push(currentState.playing.path);
    }

    setTimeout(() => {

      printer.printSong(currentState);
      analytics.trackSong(currentState);
      lyrics.setLyrics(currentState.playing);

    }, 500);
  }

  return currentState.playing;
}

export const pause = async () => {
  if (!isPlaying()) {
    return;
  }

  await osPlayer.pause();
}

export const next = async (andPlay = true) => {
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

export const getState = () => {
  return currentState;
}

const isPlaying = () => osPlayer.isPlaying();

export const isPaused = () => osPlayer.isPaused();

export const isStopped = () => osPlayer.isStopped();

export const kill = async () => await osPlayer.kill();
