import Config from './config';

const loggingLevels:{[key: string]: number} = {
  Error: 0,
  Info: 1,
  Debug: 2,
};

/**
 * The central location to manage logs
*/

export default class Logger {
  config: Config;
  logLevel: number;

  /**
   * Initializes the logger, needs config for logging level
   *
   * @param config - The config object
  */

  constructor(config: Config) {
    this.config = config;
    this.logLevel = this.config.logLevel;
  }

  /**
   * Log an [Info] message
   * @param messages - Messages to be logged
  */

  info(...messages: any[]) {
    this.format('Info', messages);
  }

  /**
   * Log a [Debug] message
   * @param messages - Messages to be logged
  */

  debug(...messages: any[]) {
    this.format('Debug', messages);
  }

  /**
   * Log an [Error] message
   * @param messages - Messages to be logged
  */

  error(...messages: any[]) {
    this.format('Error', messages);
  }

  /**
   * Handles and prints the log content
   * @param type - The type of the message you want to log
   * @param messages - Messages to be logged
  */

  format(type: string, messages: any[]) {
    const level = loggingLevels[type];

    if (level > this.logLevel) {
      return;
    }

    console.log(`[${type}] ${messages.join(' ')}`);
  }
}
