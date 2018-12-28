/**
 * A central configuration handler
*/

export default class Config {
  args: { [key: string]: any };

  constructor(args: Object) {
    this.args = args;
  }

  /**
   * Determines if we're loading in server or worker mode
   * @default - server
  */

  get mode(): string {
    if (this.args.worker) {
      return 'worker';
    }

    return 'server';
  }

  /**
   * Determines the port we are either connecting to or listening on
   * @default - 8000
  */

  get port(): number {
    const port = this.args.port;

    if (port === undefined) {
      return 8000;
    }

    return port;
  }

  /**
   * Determines the host we are either connecting to or listening on
   * @default - 0.0.0.0
  */

  get host(): string {
    const host = this.args.host;

    if (host === undefined) {
      return '0.0.0.0';
    }

    return host;
  }

  /**
   * Determines our log level
   *
   * 0 - Errors
   * 1 - Info
   * 2 - Debug
   *
   * @default - 2
  */

  get logLevel(): number {
    const logLevel = this.args.logLevel;

    if (logLevel === undefined) {
      return 2;
    }

    return logLevel;
  }
}
