exports.view = async ctx => {
  const data = await ctx.grpc.ServiceAPI.request({
    param: JSON.stringify({ "pageNum": 0, "pageSize": 1 }),
    apiName: "/documentAPI/query"
  });
  console.log(data);

  ctx.render({ name: 'plover' }, { type: 'json' });
};
