exports.view = async ctx => {
  const data = await ctx.grpc.User.get(1);
  ctx.render(data, { type: 'json' });
};
