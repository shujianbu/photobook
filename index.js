'use strict';
const Hapi = require('hapi');
const Inert = require('inert');

const server = new Hapi.Server({ host: 'localhost', port: 3000 });

const init = async () => {
  await server.register(Inert);

  server.route({
    method: 'GET',
    path: '/{file*}',
    handler: {
      directory: {
        path: 'client/'
      }
    }
  });

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

init().catch((err) => {
  console.log(err);
  process.exit(1);
});
