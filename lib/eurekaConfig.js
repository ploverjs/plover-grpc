
const ip = require('ip')
const md5 = require('md5')

module.exports = eurekaInstanceRegConfig = (config) => {
  // config.grpc = config.grpc || {}

  const appName = config.name ? config.name.replace('/', '-') : 'unnamed-node-client'
  const appVersion = config.version || '0.0.0'
  const port = config.port || 3000
  const instanceName = `${appName}:${appVersion}`
  const ipAddr = ip.address()
  const url = (pageName = '') => `http://${ipAddr}:${port}/${pageName}`

  return {
    eureka: {
      serviceUrls: {
        default: config.urls.split(',')
      }
    },
    instance: {
      app: instanceName,
      hostName: ipAddr,
      instanceId: `${md5(new Date().getTime())}:${instanceName}:${port}`,
      ipAddr: ipAddr,
      homePageUrl: url(),
      statusPageUrl: url('info'),
      healthCheckUrl: url('health'),
      secureVipAddress: instanceName,
      vipAddress: instanceName,
      port: {
        '$': port,
        '@enabled': 'true'
      },
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn',
      }
    },
    requestMiddleware: (requestOpts, done) => {
      if (config.user && config.password) {
        requestOpts.auth = {
          user: config.user,
          password: config.password
        };
      }
      done(requestOpts);
    }
  }
}