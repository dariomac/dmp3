import Hapi from '@hapi/hapi';
import StaticFilePlugin from '@hapi/inert';
import Path from 'path';
import { plugin } from './routes/index.js';
import EventEmitter from 'events';
import * as printer from '../../printer.js';
import fsx from 'fs-extra';
import Throttle from 'throttle';
import PassThrough from 'stream';
import { HapiService } from './hapi-service.js';

const preloadStart = 30;

const server = Hapi.server({
  port: process.env.PORT || 8080,
  host: process.env.HOST || 'localhost',
  compression: false,
  routes: { files: { relativeTo: Path.join(process.cwd(), '/lib/os_player_factory/hapi-radio/public') } }
});

await server.register(StaticFilePlugin);
await server.register(plugin);

let _onDone = null;
let _onBeforeDone = null;
let _intervalId;


async function _getBitRate(song) {
  try {
    // const bitRate = await ffprobe(song.path).format.bit_rate;
    // return parseInt(bitRate);
    return parseInt(song.rawMetadata.format.bitrate);
  }
  catch (err) {
    return 128000; // reasonable default
  }
}

async function _playLoop(currentSong) {
  const bitRate = await _getBitRate(currentSong);

  console.log(bitRate);

  const songReadable = fsx.createReadStream(currentSong.path);
  
  // const throttleTransformable = new Throttle(bitRate / 8);
  const throttleTransformable = new Throttle(bitRate / 8);
  throttleTransformable.on('data', (chunk) => HapiService.getInstance().broadcastToEverySink(chunk));
  // throttleTransformable.on('end', () => _playLoop(currentSong.next));
  throttleTransformable.on('end', () => _onDone());
  
  HapiService.getInstance().stream.emit('play', currentSong.path);
  songReadable.pipe(throttleTransformable);
}

async function play(song, resume = false) {
  clearInterval(_intervalId);

  if (song.duration && song.durationInSec >= preloadStart) {
    _intervalId = setTimeout(beforeDoneHandler, Math.ceil(song.durationInSec - preloadStart) * 1000)
  } else {
    beforeDoneHandler();
  }

  await _playLoop(song);

  return song;
}

async function beforeDoneHandler () {
  if (_onBeforeDone) {
    await _onBeforeDone();
  }
}

async function stop() {}

async function pause() {}

async function kill() {}

export default async ({onDone, onBeforeDone}) => 
  { 
    await server.start();
    console.log('Server running on %s', server.info.uri);

    _onDone = onDone;
    _onBeforeDone = onBeforeDone;
  
    return {
      stop,
      play,
      pause,
      kill,
      isStopped: () => false,
      isPaused: () => false,
      isPlaying: () => true
    }
  }
