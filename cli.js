#!/usr/bin/env node
import commandLineArgs from 'command-line-args';

import { player } from './lib/player.js';
import { keyboardListener } from './lib/keyboardListener.js';
import printer from './lib/printer.js';
import simulate from './lib/simulate.js';

printer.printClear();
printer.printMsg('version: 1.0.2\n');

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
    process.exit(1);
  }

  if (opts.simulate) {
    await simulate(opts);
    process.exit(0);
  }

  process.stdout.write(`\n`);

  await player.init(opts);
  await keyboardListener.init(player);

  setTimeout(async () => {
    try {
      await player.play();
    } catch (e) {
      printer.printErr(e);
      process.exit(1);
    }
  }, 500);

})().catch(e => {
  printer.printErr(e);
  process.exit(1);
  // Deal with the fact the chain failed
});
