import { PassThrough } from 'stream';
import EventEmitter from 'events';

export class HapiService {
    constructor() {
        if (HapiService.instance) {
            return HapiService.instance;
        }

        this._sinks = new Map(); // map of active sinks/writables
        this._stream = new EventEmitter();

        HapiService.instance = this;
    }

    static getInstance() {
        if (!HapiService.instance) {
            HapiService.instance = new HapiService();
        } 

        return HapiService.instance;
    }

    makeResponseSink() {
        const id = Math.random().toString(36).slice(2);
        const responseSink = PassThrough();
        this._sinks.set(id, responseSink);

        return { id, responseSink };
    }

    removeResponseSink(id) {
        this._sinks.delete(id);
    }

    get stream() {
      return this._stream;
    }

    broadcastToEverySink(chunk) {
      for (const [, sink] of this._sinks) {
          sink.write(chunk);
      }
    }
}
