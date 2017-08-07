exports.view = async ctx => {
  try {
    const data = await ctx.grpc.HelloAPI.sayHello({
      name: 'joe'
    });
    console.log(data);
  } catch (e) {
    console.log(e);
  }

  ctx.render({ name: 'plover' }, { type: 'json' });
};
