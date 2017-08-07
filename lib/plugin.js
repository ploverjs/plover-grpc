
const GrpcClient = require('./grpcNode.js')


module.exports = function (app) {
  const settings = app.settings;
  const appRoot = settings.applicationRoot;

  const client = new GrpcClient(settings.grpc);
  const done = app.readyCallback('grpc');
  initClient(client).then(done).catch(done);

  app.addService('grpc', client.services);
};


async function initClient(client) {
   await client.init();
}
