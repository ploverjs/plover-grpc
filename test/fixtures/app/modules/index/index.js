exports.view = async ctx => {
  const data = ctx.grpc.User.get(1);
  ctx.render(data, { type: 'json' });
};
