import Logger from './logger';

export type CommandFunction = (args: any) => any;

//
// CommandRegistry
// Commands that workers can execute get registered and run from
// this class
//

export default class CommandRegistry {
  commands: { [key: string]: CommandFunction };
  logger: Logger;

  constructor(logger: Logger) {
    this.commands = {};
    this.logger = logger;
  }

  /**
   * Add a new command to be run
   *
   * @param name - The name of the command
   * @param func - The function that will be executed
  */

  registerCommand(name: string, func: CommandFunction) {
    this.commands[name] = func;
    this.logger.debug('Registering Command', name);
  }

  /**
   * Execute a command from the registry
   *
   * @param name - The name of the command
   * @param args - The arguments for that command
  */

  executeCommand(name: string, args: object) {
    const command = this.commands[name];

    if (command) {
      this.logger.debug('Executing Command', name);
      return command(args);
    }

    this.logger.error('Command Not Found', name);
  }
}
