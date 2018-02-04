'use strict';

const Hapi = require('hapi');
const Inert = require('inert');

const server = new Hapi.Server({ port: 3000, host: 'localhost' });

const init = async () => {
  await server.register(Inert);

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return h.file('./client/index.html');
    }
  });

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

init().catch((err) => {
  console.log(err);
  process.exit(1);
});
