# plover-grpc
node rpc client based on grpc and eureka

## Install
```bash
npm install plover-grpc -S
```

## Usage
```js
const data = await ctx.grpc.xxAPI.xxMethod({
    param: JSON.stringify({ "pageNum": 0, "pageSize": 1 }),
    apiName: "/documentAPI/query"
});

```

## Config
```js
const pkg = require('./../package.json')

exports.grpc = {
  root:join(__dirname,"../../../@grpc"),
  name: pkg.name,
  version: pkg.version,
  user:'xx',
  password:'xx',
  urls: 'http://xxx/eureka/apps/',
  services: {
    ServiceAPI: 'xxx:xxx:xxx'
  }
};
```