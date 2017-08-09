const Eureka = require('eureka-js-client').Eureka
const fs = require('fs-extra')
const grpc = require('grpc')
const globby = require('globby')
const { join, resolve } = require('path')
const { defaultsDeep, random } = require('lodash')
const schedule = require('node-schedule');

const eurekaConfig = require('./eurekaConfig')

const grpcOptions = {
  'grpc.ssl_target_name_override': 'grpc',
  'grpc.default_authority': 'grpc',
  'grpc.max_send_message_length': 8 * 1024 * 1024,
  'grpc.max_receive_message_length': 8 * 1024 * 1024
}

const metadataUpdater = (service_url, callback) => {
  const metadata = new grpc.Metadata()
  metadata.set('plugin_key', 'plugin_value')
  callback(null, metadata)
}
// 缓存service链接信息
const serviceCache = {};
//缓存eureka的服务注册信息
const appInstanceCache = {};

class GrpcClient {
  constructor(config) {
    this.eurekaClient = new Eureka(eurekaConfig(config))
    this.config = config
    this.serviceConfig = config.services
    this.combined_creds = null
    this.protos = {}
    this.services = {}
  }

  async init() {
    //await this.eurekaClient.start();
    await this.initGrpcClient();
    await this.initServices();
    this.initSchedule();
  }

  /**
   * 初始化grpc的配置并解析protobuf文件
   */
  async initGrpcClient() {
    await this._loadPem();
    await this._loadProto();
  }

  /**
   * 初始化grpc的服务配置，并且匹配pb文件
   * service配置例子如下：    ServiceAPI: 'com.qingguatang.gateway.api.ServiceAPI:rome-api:1.0.1'
   */
  async initServices() {
    await this._startEurekaClient();

    for (const serviceName of Object.keys(this.serviceConfig)) {
      // 解析service配置，如 com.qingguatang.gateway.api.ServiceAPI:rome-api:1.0.1
      const cache = this.serviceConfig[serviceName].split(':');
      if (cache.length !== 3) {
        throw new Error(`the service of ${serviceName}:${this.serviceConfig[serviceName]} config is error. make sure config format interfaceName:group:version!`);
      }
      const packageName = cache[0];
      const applicationName = `${cache[1]}:${cache[2]}`;
      const npmPackageName = cache[1];
      // 缓存应用名称，作为注册中心的key
      if (!appInstanceCache[applicationName]) {
        appInstanceCache[applicationName] = [];
      }
      const packageNameArr = packageName.split('.')
      let grpcConstructor = this.protos
      // 匹配 proto 信息
      while (grpcConstructor && packageNameArr.length) {
        grpcConstructor = grpcConstructor[packageNameArr[0]]
        packageNameArr.splice(0, 1)
      }

      if (!grpcConstructor) {
        throw new Error(`${applicationName} proto is not found.`);
      }

      this.services[serviceName] = this._wrapService({
        applicationName,
        serviceName,
        grpcConstructor
      })
    }
  }

  /**
     * 初始化调度任务，每10s主动连接一次注册中心，获取最新的服务注册列表
     */
  initSchedule() {
    var j = schedule.scheduleJob({ second: 10 }, () => {
      for (const appId of Object.keys(appInstanceCache)) {
        this._getGrpcInstances(appId, true);
      }
    });
  }

  /**
   * 拦截所有的方法，变成grpc调用
   * @param {*} service 
   */
  _wrapService(service) {
    const result = {}
    for (const method of Object.keys(service.grpcConstructor.service)) {
      result[method] = this._callService(service, method)
    }
    return result
  }

  /**
   * 执行grpc的远程调用
   * @param {*} service 
   * @param {*} methodName 
   */
  _callService(service, methodName) {
    const { applicationName, serviceName, grpcConstructor } = service

    return (req, callback) => {
      return new Promise((resolve, reject) => {
        const client = this._getClientInstance(applicationName, serviceName, grpcConstructor);
        if (client === null) {
          reject("the service group :" + applicationName + " no provider!please check grpc config!!!");
          return;
        }
        client.client[methodName](req, (err, resp) => {
          if (err) {
            console.error("request the service: " + serviceName + "." + methodName + " to " + client.instanceInfo, err);
            if (err.code === 14) {
              //code 14是网络错误，可能是ip不通，或者服务器已经下线了
              delete serviceCache[client.instanceInfo];
            }
            reject(err);
          } else {
            resolve(resp)
          }
        })
      })
    }
  }

  /**
   * 启动eureka客户端
   */
  _startEurekaClient() {
    return new Promise((resolve, reject) => {
      this.eurekaClient.start(err => {
        if (err) {
          reject(err)
        }
        resolve();
      })
    });
  }

  /**
   * 获取grpc客户端实例
   * @param {*} appId 
   * @param {*} serviceName 
   * @param {*} grpcConstructor 
   */
  _getClientInstance(appId, serviceName, grpcConstructor) {

    const instances = this._getGrpcInstances(appId);

    if (!instances || instances.length === 0) {
      return null;
    }
    // 随机取一个实例进行连接
    const instance = instances[random(0, instances.length - 1)];

    const cacheName = `${instance.hostName}:${instance.port.$ + 1}:${serviceName}`;
    let client = serviceCache[cacheName];
    if (client) {
      return { client, instanceInfo: cacheName };
    }

    client = new grpcConstructor(
      `${instance.hostName}:${instance.port.$ + 1}`,
      this.combined_creds, grpcOptions
    )

    serviceCache[cacheName] = client;
    return { client, instanceInfo: cacheName };
  }

  /**
   * 获取eurake service注册信息
   * @param {*} appId 
   * @param {*} noCache 
   */
  _getGrpcInstances(appId, noCache) {
    let instances;
    // 取缓存
    if (!noCache) {
      instances = appInstanceCache[appId];
      if (instances.length > 0) {
        return instances;
      }
    }
    // 查询eureka
    instances = this.eurekaClient.getInstancesByAppId(appId);
    if (instances === null || instances.length === 0) {
      for (var index = 0; index < 2; index++) {
        instances = this.eurekaClient.getInstancesByAppId(appId);
      }
    }
    //缓存有效的数据，防止网络意外丢失了正确的数据
    if (instances && instances.length > 0) {
      appInstanceCache[appId] = instances;
    }
    return instances;
  }

  /**
   * 加载 ssl证书
   */
  async _loadPem() {
    const pemPath = this.config.pem || join(__dirname, './server.pem');
    const pem = await fs.readFile(pemPath);
    const ssl_creds = grpc.credentials.createSsl(pem)
    const call_creds = grpc.credentials.createFromMetadataGenerator(metadataUpdater)
    this.combined_creds = grpc.credentials.combineChannelCredentials(ssl_creds, call_creds)
  }

  /**
   * 扫描并加载 protobuf文件
   */
  async _loadProto() {

    const root = this.config.root;
    const dirs = fs.readdirSync(root);
    const patterns = [];
    // 为了避免cnpm install 产生的文件夹link问题，先读取到每个目录的真实地址
    dirs.forEach(dir => {
      let pbRoot = fs.realpathSync(join(root, dir));
      let pattern = join(pbRoot, '**/src/main/proto/**/*_api.proto');
      patterns.push(pattern);
    });
    //扫描proto
    const pbPaths = await globby.sync(patterns)
    for (const path of pbPaths) {
      const pbRoot = resolve(path, '../../');
      // 加载 proto
      this.protos = defaultsDeep(this.protos, grpc.load({
        root: pbRoot,
        file: path.substring(pbRoot.length)
      }))
    }
  }
}

module.exports = GrpcClient
