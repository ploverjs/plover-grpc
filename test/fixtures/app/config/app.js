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
  user:'saluki',
  password:'saluki',
  urls: 'http://eureka.qingguatang.com/eureka/apps/',
  services: {
    ServiceAPI: 'com.qingguatang.gateway.api.ServiceAPI:rome-api:1.0.1'
  }
};