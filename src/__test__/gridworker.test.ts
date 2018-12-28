import GridWorker from '../lib';

it('can run through basic flow', async () => {
  // Start Server
  const server = new GridWorker({
    server: true,
  });

  server.startServer();

  expect(server.server).not.toBeUndefined();

  // Create worker
  const worker = new GridWorker({
    worker: true,
  });

  worker.connectToServer();

  expect(worker.worker).not.toBeUndefined();

  expect(worker).not.toBeUndefined();

  // Register worker task
  let didRunTask = false;

  worker.registerCommand('myCmd', (args: {[key: string]: any}) => {
    didRunTask = true;

    const { key } = args;

    const keyP1 = key + 1;

    return { key: keyP1 };
  });

  // Execute task from server
  const promises = 'abcdefghijklmnopqrstuvwxyz'.split('').map(async (key) => {
    const promise = server.executeCommand('myCmd', { key });

    const result = await promise;

    expect(result).not.toBeUndefined();

    if (result) {
      expect(result.key).toEqual(key + 1);
    }

    expect(didRunTask).toEqual(true);
  });

  await Promise.all(promises);

  // Shut down server
  await server.stopServer();
});
