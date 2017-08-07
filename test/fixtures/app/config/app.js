/**
 * grpc相关配置
 */
const pkg = require('./../../../../package.json')
const { join } = require('path');


exports.grpc = {
  root:join(__dirname,"../../../@grpc"),
  name: pkg.name,
  version: pkg.version,
  urls: 'http://saluki:saluki@eureka.qingguatang.com/eureka/apps',
  services: {
    HelloAPI: 'io.grpc.examples.helloworld.Greeter:saluki2.example.server:1.0.0'
  }
};