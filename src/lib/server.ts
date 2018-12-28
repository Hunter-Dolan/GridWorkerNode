import io, { Socket } from 'socket.io';
import Config from './config';

import Commander from './commander';
import Logger from './logger';

/**
 * The base server class that handles listening to and for workers
 */

export default class Server {
  server: io.Server;
  config: Config;

  commander: Commander;
  logger: Logger;

  /**
   * Starts the server and registers new connections with the commander
   *
   * @param config - The primary configuration object
   * @param commander - The primary commander object
   * @param logger - The primary logger object
  */

  constructor(config: Config, commander: Commander, logger: Logger) {
    this.config = config;

    this.commander = commander;
    this.logger = logger;

    const { port } = this.config;

    this.server = io(port);

    this.logger.info('Server started on', port);

    this.server.on('connection', (socket) => {
      this.logger.debug('New Socket Connection', socket);
      this.commander.registerWorker(socket);
    });
  }

  stop() {
    return new Promise((resolve, _) => {
      this.server.close(resolve);
    });
  }
}
