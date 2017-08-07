exports.view = async ctx => {
  const data = await ctx.grpc.HelloAPI.SayHello({
    name:'joe'
  });
 // ctx.render(data, { type: 'json' });
  console.log(data);
  ctx.render({name: 'plover' }, { type: 'json' });
};
