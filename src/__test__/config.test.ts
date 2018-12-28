import Config from '../lib/config';

it('can define a base config', () => {
  const config = new Config({
    port: 8080,
    host: 'localhost',
    worker: true,
  });

  expect(config.port).toEqual(8080);
  expect(config.host).toEqual('localhost');
  expect(config.mode).toEqual('worker');
});
