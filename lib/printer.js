import chalk from 'chalk';
import util from 'util';
import logUpdate from 'log-update';
import columns from 'cli-columns';
import _ from 'lodash';
import betterLogging from 'better-logging';

class Printer {
  #expanded;
  #pidOffset;

  constructor() {
    if (Printer.instance) {
      return Printer.instance;
    }

    betterLogging(console, {
      color: {
        base: chalk.greenBright,
        type: {
          debug: chalk.magentaBright,
          info: chalk.magentaBright,
          log: chalk.magentaBright,
          error: chalk.blue,
          warn: chalk.blue,
        }
      },
    });

    this.#expanded = false;
    this.#pidOffset = '       ';
    
    Printer.instance = this;
  }

  printSong(playState) {
    try {
      if (!playState.playing.duration || playState.playing.duration.indexOf('EISDIR') !== -1) {
        return;
      }
    } catch (err) {
      console.error(`Playing ${playState.playing.path}`);
      console.error(err);
    }

    if (this.#expanded) {
      this.collapse();
    }

    const tags = playState.playing.tags;
    process.stdout.write(chalk.grey(`[${playState.playing.pid}]`));
    process.stdout.write(`\t`);

    process.stdout.write(chalk.rgb(83, 81, 143)(`${tags.artist}`));
    process.stdout.write(` - `);
    process.stdout.write(chalk.rgb(83, 81, 143)(`${tags.album}`));
    process.stdout.write(chalk.grey(` // `));
    process.stdout.write(tags.track ? `${tags.track}.` : '');
    process.stdout.write(`${tags.title}`);
    process.stdout.write(` `);

    process.stdout.write(chalk.gray(`(${playState.playing.duration})`));
    process.stdout.write(`\n`);

    process.stdout.write(this.#pidOffset);
    process.stdout.write(chalk.hex('#303030')(`${playState.playing.path.replace(playState.topLevelDir, '')}`));

    process.stdout.write(`\n`);
  }

  printBye() {
    process.stdout.write(chalk.green(`\nBye !!!\n`));
  }

  printEOS() {
    process.stdout.write(chalk.green(`\nThis is the end.\nNo more MP3s to play\n`));
  }

  printDetails(playState) {
    const debugInfo = util.inspect(playState.playing.rawMetadata, { showHidden: false, depth: null });

    if (this.#expanded) {
      this.collapse();
    } else {
      this.expand(chalk.yellow(`${debugInfo}\n`));
    }
  }

  expand(content) {
    logUpdate(content);
    this.#expanded = true;
  }

  collapse() {
    if (this.#expanded) {
      logUpdate.clear();
      logUpdate.done();
      this.#expanded = false;
    }
  }

  printErr(err) {
    process.stdout.write(chalk.red(`${err}`));
  }

  printClear() {
    process.stdout.write('\x1bc');
  }

  printLyrics(song) {
    if (this.#expanded) {
      this.collapse();
    } else {
      let words = song.lyrics.words;
      if (words) {
        words = columns(_.chunk(words.replace(/\n\n/g, '\n \n').split('\n'), 1), {
          sort: false,
          width: process.stdout.columns
        });
        if (!song.lyrics.local) {
          words = `${words}\n\n${chalk.red('TEMPORAL LYRICS (downloaded but not saved)')}`;
        }
      } else {
        words = 'There is no lyric file for this song';
      }

      this.expand(chalk.yellow(`\n${words}\n`));
    }
  }

  printMsg(msg) {
    process.stdout.write(msg);
  }

  printObj(obj) {
    process.stdout.write(util.inspect(obj, { showHidden: false, depth: null }));
  }

  printHelp() {
    if (this.#expanded) {
      this.collapse();
    } else {
      this.expand(chalk.yellow(`
      h: Help
      
      z: Previous song
      x: Stop
      c: Pause/Play
      v: Next song

      d: Show details
      l: Show lyrics
      
      o: Download and override lyrics
      p: Paste from clipboard overriding lyrics
      
      f: Mark this track as favorite
      
      q: Quit
      `));
    }
  }

  setLogLevel(lvl) {
    /*https://olian04.gitbook.io/better-logging/setup/log-levels
      debug: 4
      log: 3
      info: 2
      warn: 1
      error: 0
      line: 1
      turn off all logging: -1
      default: 3
    */
    console.logLevel = lvl;
  }

  customReplacer(key, value) {
    if (key === 'type' || key === 'data' || key === 'path') {
      return undefined;
    }
    if (key === 'children' && value.length === 0) {
      return undefined;
    }

    return value;
  }
}

export const printer = new Printer();
