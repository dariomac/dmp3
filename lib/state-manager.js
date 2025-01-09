import _ from 'lodash';
import fsx from 'fs-extra';
import path from 'path';

import { printer } from './printer.js';
import { createSong } from './typesFactory.js';
import { randomInt } from './random.js';

class StateManager {
  constructor() {
    if (!StateManager.instance) {
      StateManager.instance = this;
    }
    return StateManager.instance;
  }

  async #stat(path) {
    return await fsx.stat(path);
  }

  async #readdir(path, options) {
    return await fsx.readdir(path, options);
  }

  #setToplevelDirectory(playState, isFile) {
    if (!playState.topLevelDir) {
      playState.topLevelDir = path.resolve(playState.playing.path);

      if (isFile) {
        playState.topLevelDir = path.dirname(playState.topLevelDir);
      }
    }
    return playState;
  }

  #pushFileAsPlayed(playState, filePath) {
    playState.fullyPlayedDirs.add(filePath);
  }

  #pushDirAsPlayed(playState, dirPath) {
    playState.fullyPlayedDirs.add(dirPath);
  }

  #changeToPriorDirectory(playState, dirname) {
    const priorDirectory = path.resolve(dirname, '..');
    if (priorDirectory !== path.dirname(playState.topLevelDir)) {
      playState.next = createSong(priorDirectory);
      return playState;
    } else {
      return null;
    }
  }

  async #getPlayableDirs(playState, dirname) {
    let dirs = _
      .filter((await this.#readdir(playState.playing.path, { withFileTypes: true })), function (item) {
        return item.isDirectory();
      })
      .map(function (item) {
        return path.resolve(dirname, item.name);
      })
      .filter(function (dir) {
        let keep = !playState.fullyPlayedDirs.find(path.resolve(dirname, dir));
        return keep;
      });

    return dirs;
  }

  async #getPlayableItems(playState, dirname) {
    let items = _
      .filter((await this.#readdir(dirname)), function (item) {
        return item !== '.DS_Store' && (path.extname(item) === '.mp3' || path.extname(item) === '');
      })
      .filter(function (item) {
        let keep = !playState.fullyPlayedDirs.find(path.resolve(dirname, item));
        return keep;
      })
      .sort(function (a, b) {
        if (path.extname(a) === '.mp3' && path.extname(b) === '') {
          return -1;
        }

        if (path.extname(a) === '' && path.extname(b) === '.mp3') {
          return 1;
        } else {
          return a.toLowerCase().localeCompare(b.toLowerCase());
        }
      })
      .map(function (item) {
        return path.resolve(dirname, item);
      });

    return items;
  }

  async #setRandomState(playState, items, playingStat, dirname, goDeep) {
    if (playingStat.isDirectory()) {
      if (goDeep) {
        let dirs = await this.#getPlayableDirs(playState, dirname);

        if (dirs.length > 0) {
          items = dirs;
        }
      }

      const playingIdx = await randomInt(0, items.length - 1);
      playState.playing.path = items[playingIdx];

      const res = await this.setState(playState);
      if (res) {
        console.debug('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
        console.debug('Playing:', res.playing.path);
        console.debug('Next: ', res.next.path);
        console.debug('FullyPlayed:', JSON.stringify(res.fullyPlayedDirs, printer.customReplacer, 2));
      }
      return res;
    } else {
      this.#pushFileAsPlayed(playState, playState.playing.path);
    }

    // Now that I know what to play, lets figure it out next one
    dirname = playState.topLevelDir;
    items = await this.#getPlayableItems(playState, dirname);

    if (items.length > 0) {
      const nextIdx = _.random(0, items.length - 1);
      playState.next = createSong(items[nextIdx]);
    }

    return playState;
  }

  async #setSortedState(playState, items, playingStat, dirname) {
    let playingIdx;
    if (playingStat.isDirectory()) {
      playingIdx = 0;

      playState.playing.path = items[playingIdx];
      return await this.setState(playState);
    } else {
      playingIdx = _.findIndex(items, function (item) {
        return item === playState.playing.path;
      });
    }

    const nextIdx = playingIdx + 1;
    if (nextIdx < items.length) {
      playState.next = createSong(items[nextIdx]);

      // If next seems to be a directory
      if (path.extname(playState.next.path) === '') {
        const nextStat = await this.#stat(playState.next.path);
        // If really is a directory
        if (nextStat.isDirectory()) {
          // Push current directory as played
          this.#pushDirAsPlayed(playState, dirname);
        }
      }
    } else {
      this.#pushDirAsPlayed(playState, dirname);
      playState = this.#changeToPriorDirectory(playState, dirname);
    }

    return playState;
  }

  async setState(playState) {
    console.debug('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.debug('Playing: ', playState.playing.path);
    console.debug('Next: ', playState.next.path);
    console.debug('FullyPlayed: ', JSON.stringify(playState.fullyPlayedDirs, printer.customReplacer, 2));

    playState.playing.path = path.resolve(playState.playing.path);

    const playingStat = await this.#stat(playState.playing.path);
    let dirname;
    if (playingStat.isFile()) {
      dirname = path.dirname(playState.playing.path);
    } else {
      dirname = playState.playing.path;
    }

    // Set toplevel directory
    playState = this.#setToplevelDirectory(playState, playingStat.isFile());

    let items = await this.#getPlayableItems(playState, dirname);

    // If there are no items to play
    if (items.length === 0) {
      this.#pushDirAsPlayed(playState, dirname);

      playState = this.#changeToPriorDirectory(playState, dirname);
    } else {
      if (playState.mode === 'random') {
        playState = await this.#setRandomState(playState, items, playingStat, dirname, _.random(0, 1));
      } else {
        playState = await this.#setSortedState(playState, items, playingStat, dirname);
      }
    }
    if (playState && path.extname(playState.playing.path) === '') {
      playState.playing = playState.next;
      playState = this.setState(playState);
    }

    return playState;
  }
}

export const stateManager = new StateManager();
