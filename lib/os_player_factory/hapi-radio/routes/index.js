import { HapiService } from '../hapi-service.js';

export const plugin = {
    name: 'streamServer',
    register: async (server) => {

        server.route({
            method: 'GET',
            path: '/',
            handler: (_, h) => h.file('index.html')
        });

        server.route({
            method: 'GET',
            path: '/{filename}',
            handler: {
                file: (req) => req.params.filename
            }
        });

        server.route({
            method: 'GET',
            path: '/stream',
            handler: (request, h) => {
                
                const { id, responseSink } = HapiService.getInstance().makeResponseSink();
                request.app.sinkId = id;
                return h.response(responseSink).type('audio/mpeg');
            },
            options: {
                ext: {
                    onPreResponse: {
                        method: (request, h) => {
                            
                            request.events.once('disconnect', () => {
                                HapiService.getIntance().removeResponseSink(request.app.sinkId);
                            });
                            return h.continue;
                        }
                    }
                }
            }
        });
    }
};
