
/*
const playSong = require('./play-song');

const dirs = process.argv.slice(2);
console.log(dirs)

playSong({
  //path: './mp3/01. Darker Thoughts.mp3'
  path: '/Volumes/MP3/Blues/Hugh Laurie - Let Them Talk (2011)/01 - St. James Infirmary.mp3'
});
*/
const commandLineArgs = require('command-line-args');

const optionDefinitions = [
  { name: 'mode', alias: 'm', type: String },
  { name: 'src', type: String, multiple: true, defaultOption: true },
];

const opts = commandLineArgs(optionDefinitions);

if (! opts.src) {
  console.log('Yo must specify at least one path');
}
else {
  console.log(opts.src);
}
