//var Eureka  = require('eureka-js-client') ;


// Or, if you're not using a transpiler:
const Eureka = require('eureka-js-client').Eureka;

// example configuration
const client = new Eureka({
  // application instance information
  instance: {
    app: 'jqservice',
    hostName: 'joe-mac',
    ipAddr: '127.0.0.1',
    port: {
      '$': 8080,
      '@enabled': true,
    },
    vipAddress: 'jq.test.something.com',
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
  },
  eureka: {
    serviceUrls: {
      default: [
        'http://eureka.qingguatang.com/eureka/apps/'
      ]
    }
  },

  requestMiddleware: (requestOpts, done) => {
    requestOpts.auth = {
      user: 'saluki',
      password: 'saluki'
    };
    done(requestOpts);
  }
});

client.start(function(){
  let instances = client.getInstancesByAppId('SALUKI2.EXAMPLE.SERVER:1.0.0');
  console.log(instances);
});




