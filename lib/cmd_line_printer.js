const chalk = require('chalk');
const path = require('path');

function printSong (opts, playState) {
  const tags = playState.playing.tags;
  process.stdout.write(chalk.grey(`[${playState.playing.pid}]`));
  process.stdout.write(`\t`)
  process.stdout.write(chalk.rgb(83, 81, 143)(`${tags.artist}`));
  process.stdout.write(` - `)
  process.stdout.write(chalk.rgb(83, 81, 143)(`${tags.album}`));
  process.stdout.write(`\t`);
  process.stdout.write(`${tags.trackNumber}.`);
  process.stdout.write(`${tags.title}`);
  process.stdout.write(` `);
  process.stdout.write(chalk.gray(`(${playState.playing.duration})`));
  process.stdout.write(`\t`);
  process.stdout.write(chalk.gray(`${playState.playing.path.replace(playState.topLevelDir, '')}`));

  process.stdout.write(`\n`);
}

function printBye () {
  process.stdout.write(chalk.green(`\nBye !!!\n`));
}

module.exports = {
  printSong,
  printBye
}
