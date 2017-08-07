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


  app.addService('grpc', client.services);
};

