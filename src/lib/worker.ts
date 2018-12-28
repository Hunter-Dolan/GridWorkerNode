import io from 'socket.io-client';

import Config from './config';
import CommandRegistry from './command_registry';
import Logger from './logger';

/**
 * The base worker class that handles connecting to servers
*/

export default class Worker {
  socket: SocketIOClient.Socket;
  config: Config;
  registry: CommandRegistry;
  logger: Logger;

  /**
   * Initializes the worker instance and connects to the server
   *
   * @param config - The primary Config
   * @param registry - The primary CommandRegistry
   * @param logger - The primary Logger
   */

  constructor(config: Config, registry: CommandRegistry, logger: Logger) {
    this.config = config;
    this.registry = registry;
    this.logger = logger;

    const { host, port } = this.config;
    const url = `http://${host}:${port}`;

    this.logger.debug('Attempting to connect to server at', url);

    this.socket = io(url);

    this.logger.debug('Connected with socket', this.socket.id);

    this.socket.on('exec', this.handleExec);
  }

  /**
   * Handles exec requests from servers
   *
   * @param msg - The input msg from the socket
   */

  handleExec = (msg: {[key: string]: any}) => {
    const { cmd, args, uuid } = msg;

    this.logger.debug('Execution Requested', cmd, uuid);

    let result = {};
    let success = false;

    try {
      result = this.registry.executeCommand(cmd, args);
      this.logger.debug('Command Success', cmd, uuid);
      success = true;
    } catch (e) {
      result = { error: e.toString() };
      this.logger.error('Command Failure', cmd, uuid, args, e.toString());
      success = false;
    }

    this.socket.emit('finish', { uuid, result, success });

    this.logger.debug('Execution Complete', cmd, uuid);
  }
}
