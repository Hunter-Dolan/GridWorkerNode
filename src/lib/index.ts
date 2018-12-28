import Config from './config';
import CommandRegistry, { CommandFunction } from './command_registry';

import Server from './server';
import Worker from './worker';
import Commander from './commander';
import Logger from './logger';

/**
 * GridWorker
 * The base instance of the GridWorker lib
*/

export default class GridWorker {
  /**
   * The Configuration for the process
   */

  config: Config;

  /**
   * The Logger for the process
   */

  logger: Logger;

  registry?: CommandRegistry;
  commander?: Commander;

  server?: Server;
  worker?: Worker;

  /**
   * Initializes the GridWorker
   * @param config - The configuration object for the grid worker
  */

  constructor(config: {[key: string]: any }) {
    this.config = new Config(config);
    this.logger = new Logger(this.config);
    this.setup();
  }

  /**
   * Determines if we're a server a worker and continues depending
  */

  setup() {
    if (this.config.mode === 'server') {
      this.commander = new Commander(this.logger);
      return;
    }

    this.registry = new CommandRegistry(this.logger);
  }

  /**
   * Starts the grid worker server
  */

  startServer() {
    if (this.commander) {
      this.server = new Server(this.config, this.commander, this.logger);
    }
  }

  /**
   * Shuts dow the server
   */
  async stopServer() {
    if (this.server) {
      await this.server.stop();
    }
  }

  /**
   * Connects to the grid worker server as a worker
  */

  connectToServer() {
    if (this.registry) {
      this.worker = new Worker(this.config, this.registry, this.logger);
    }
  }

  /**
   * Registers a new command that can be executed as a worker
   * @param name - The name of the command to be registered
   * @param func - The actual code that will be executed for the command
  */

  registerCommand(name: string, func: CommandFunction) {
    if (this.registry) {
      this.registry.registerCommand(name, func);
    }
  }

  /**
   * Adds a new task to the task pool
   * @param cmd - The name of the command to be executed
   * @param args - The arguments for this command
  */

  executeCommand(cmd: string, args: object) {
    if (this.commander) {
      return this.commander.executeCommand(cmd, args);
    }

    return;
  }
}
