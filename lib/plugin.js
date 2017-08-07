
const GrpcClient = require('./grpcNode.js')


module.exports = function (app) {
  const settings = app.settings;
  const appRoot = settings.applicationRoot;

  const client = new GrpcClient(settings.grpc);
  const done = app.readyCallback('grpc');

<<<<<<< HEAD
  initClient(client).then(done).catch(done);

  console.log(client.services);
=======
  const done = app.readyCallback('grpc');
  initClient(client).then(done).catch(done);
>>>>>>> 07bab58cf73e54d5a6d779ad3a2461f8bb847a78

  app.addService('grpc', client.services);
};


<<<<<<< HEAD
async function initClient(client) {
   await client.init();
}
=======

async function initClient(client) {
}
>>>>>>> 07bab58cf73e54d5a6d779ad3a2461f8bb847a78
