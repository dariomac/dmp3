#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const player = require('./lib/player');
const listen = require('./lib/listen');
const printer = require('./lib/cmd_line_printer');
const simulate = require('./lib/simulate');

printer.printClear();

const optionDefinitions = [
  { name: 'mode', alias: 'm', type: String },
  { name: 'src', type: String, multiple: false, defaultOption: true },
  { name: 'simulate', alias: 's', type: Boolean }
];

const opts = commandLineArgs(optionDefinitions);

(async () => {
  if (! opts.src) {
    printer.printErr('You must specify at least one path');
    return;
  }

  if (opts.simulate) {
    await simulate(opts);
    return;
  }

  process.stdout.write(`\n`);

  await player.init(opts);
  await listen(player);

  setTimeout(async () => {
    await player.play();
  }, 500);

})().catch(e => {
  printer.printErr(e);
  process.exit();
  // Deal with the fact the chain failed
});
