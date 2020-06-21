const chalk = require('chalk');
const util = require('util');
const readline = require('readline');

let expanded = false;
let detailLines = -1;

const pidOffset = '       ';

function printSong (playState) {
  if (playState.playing.duration.indexOf('EISDIR') !== -1) {
    return;
  }

  collapse();

  const tags = playState.playing.tags;
  process.stdout.write(chalk.grey(`[${playState.playing.pid}]`));
  process.stdout.write(`\t`)

  process.stdout.write(chalk.rgb(83, 81, 143)(`${tags.artist}`));
  process.stdout.write(` - `)
  process.stdout.write(chalk.rgb(83, 81, 143)(`${tags.album}`));
  process.stdout.write(chalk.grey(` // `));
  process.stdout.write(`${tags.track}.`);
  process.stdout.write(`${tags.title}`);
  process.stdout.write(` `);

  process.stdout.write(chalk.gray(`(${playState.playing.duration})`));
  process.stdout.write(`\n`);

  process.stdout.write(pidOffset);
  process.stdout.write(chalk.hex('#303030')(`${playState.playing.path.replace(playState.topLevelDir, '')}`));

  process.stdout.write(`\n`);
}

function printBye () {
  process.stdout.write(chalk.green(`\nBye !!!\n`));
}

function printEOS () {
  process.stdout.write(chalk.green(`\nThis is the end.\nNo more MP3s to play\n`));
}

function printDetails(playState) {
  const debugInfo = util.inspect(playState.playing.rawMetadata, { showHidden: false, depth: null });

  if (expanded) {
    collapse();
  }
  else {
    expand(chalk.yellow(`${debugInfo}\n`));
  }
}

function expand (content) {
  process.stdout.write(content);
  detailLines = content.split(/\r\n|\r|\n/).length;
  expanded = true;
}

function collapse() {
  if (detailLines > 0) {
    readline.moveCursor(process.stdout, 0, -(detailLines-1));
    readline.clearScreenDown(process.stdout);
    detailLines = -1;
    expanded = false;
  }
}

function printErr(err) {
  process.stdout.write(chalk.red(`${err}`));
}

function printClear() {
  process.stdout.write('\x1bc');
}

function printLyrics(lyrics) {
  if (expanded) {
    collapse();
  }
  else {
    expand(chalk.yellow(`${lyrics}\n`));
  }
}

module.exports = {
  printSong,
  printBye,
  printEOS,
  printDetails,
  printErr,
  printClear,
  printLyrics
}
