#!/usr/bin/env node
import commandLineArgs from 'command-line-args';

import player from './lib/player.js';
import listen from './lib/listen.js';
import printer from './lib/printer.js';
import simulate from './lib/simulate.js';

printer.printClear();

const optionDefinitions = [
  { name: 'mode', alias: 'm', type: String },
  { name: 'src', type: String, multiple: false, defaultOption: true },
  { name: 'simulate', alias: 's', type: Boolean },
  { name: 'loglevel', alias: 'l', type: Number, defaultValue: -1 },
];

const opts = commandLineArgs(optionDefinitions);
printer.setLogLevel(opts.loglevel);

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
    try {
      await player.play();
    } catch (e) {
      printer.printErr(e);
      process.exit();
    }
  }, 500);

})().catch(e => {
  printer.printErr(e);
  process.exit();
  // Deal with the fact the chain failed
});
