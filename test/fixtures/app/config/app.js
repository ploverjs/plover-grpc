/**
 * grpc相关配置
 */
const pkg = require('./../../../../package.json')
const { join } = require('path');


/**
 * 服务器相关配置
 */
exports.server = {
  port: 3000
};

exports.grpc = {
  root:join(__dirname,"../../../@grpc"),
  name: pkg.name,
  version: pkg.version,
  urls: 'http://eureka.qingguatang.com/eureka/apps/',
  services: {
    HelloAPI: 'io.grpc.examples.helloworld.Greeter:SALUKI2.EXAMPLE.SERVER:1.0.0'
  }
};