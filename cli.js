#!/usr/bin/env node
import commandLineArgs from 'command-line-args';

import * as player from './lib/player.js';
import { keyboardListener } from './lib/keyboardListener.js';
import * as printer from './lib/printer.js';
import simulate from './lib/simulate.js';

const opts = commandLineArgs([
  { name: 'mode', alias: 'm', type: String },
  { name: 'src', type: String, multiple: false, defaultOption: true },
  { name: 'simulate', alias: 's', type: Boolean },
  { name: 'loglevel', alias: 'l', type: Number, defaultValue: -1 },
]);

(async () => {
  printer.setLogLevel(opts.loglevel);
  printer.printClear();
  printer.printMsg('version: 1.0.2\n\n');
  
  if (!opts.src) {
    printer.printErr('You must specify at least one path');
    process.exit(1);
  }

  if (opts.simulate) {
    await simulate(opts);
    process.exit(0);
  }

  await player.init(opts);
  await keyboardListener.init(player);

  setTimeout(async () => {
    await player.play();
  }, 500);

})().catch(e => {
  printer.printErr(e);
  process.exit(1);
  // Deal with the fact the chain failed
});
