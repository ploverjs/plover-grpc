module.exports = function(app) {
  const settings = app.settings;
  const appRoot = settings.applicationRoot;

  const client = {
    services: {
      User: {
        get() {
          return { name: 'plover' };
        }
      }
    }
  };

  const done = app.readyCallback('qrpc');
  initClient(client).then(done).catch(done);

  app.addService('grpc', client.services);
};



async function initClient(client) {
}
