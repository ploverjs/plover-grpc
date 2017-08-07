const pathUtil = require('path');
const mm = require('plover-test-mate');


describe('plugin', () => {
  const app = mm({
    applicationRoot: pathUtil.join(__dirname, 'fixtures/app')
  });

  app.install(require('../lib/plugin'));


  it('works', async () => {
    const o = await app.get('/');
    o.body.should.eql({ name: 'plover' });
  });
});
