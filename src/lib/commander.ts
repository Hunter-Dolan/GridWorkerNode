import { Socket } from 'socket.io';
import { v4 as UUID } from 'uuid';
import Logger from './logger';

/**
 * The data representation of a piece of work that needs to be executed
*/

interface Task {
  uuid: string;
  cmd: string;
  args: object;
}

/**
 * A base type for the result of an execution
*/

export type CommandResult = {[key: string]: any};

/**
 * An alias type of Socket. The data type of a remote worker
*/

export type Worker = Socket;

/**
 * Plans and delegates tasks across the grid of workers
 * Ensures that each worker has a task and that each task is completed
 *
 * @param logger - The logger for the process
*/

export default class Commander {
  workerPool: {[key: string]: Worker};

  taskPool: {[key: string]: Task};
  activeTasks: {[key: string]: Task};

  taskPromises: {[key: string]: [Function, Function]};

  logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;

    this.workerPool = {};

    this.taskPool = {};
    this.activeTasks = {};
    this.taskPromises = {};
  }

  /**
   * Sets up a listener for the worker and adds it to the worker pool
   *
   * @param worker - The worker that is to be registered
  */

  registerWorker(worker: Worker) {
    this.logger.info('Registering Worker', worker.id);

    worker.on('finish', (args) => {
      this.addWorkerToPool(worker);

      const { uuid, success, result } = args;

      const promiseTuple = this.taskPromises[uuid];

      if (promiseTuple) {
        delete this.taskPromises[uuid];
        promiseTuple[success ? 0 : 1](result);
      }
    });

    this.addWorkerToPool(worker);
  }

  /**
   * Adds a worker to the worker pool so that a task can be assigned to it
   * Also attempts to flush the task pool if there is outstanding work
   *
   * @param worker - The worker that is to be added
  */

  addWorkerToPool(worker: Worker) {
    this.workerPool[worker.id] = worker;
    this.attemptFlushTaskPool();

    this.logger.debug('Adding Worker to Pool', worker.id);
  }

  /**
   * Adds a task to the task pool so that it can be performed by a worker
   * Also attempts to flush the task pool if there is a waiting worker
   *
   * @param task - The task that is to be added
  */

  addTaskToTaskPool(task: Task) {
    this.taskPool[task.uuid] = task;
    this.attemptFlushTaskPool();

    this.logger.debug('Adding Task to Pool', task.uuid);
  }

  /**
   * If there is a worker waiting for work and a task waiting to be performed
   * this method will assign the task to the worker
  */

  attemptFlushTaskPool() {
    const task = this.getTask();
    const worker = this.getWorker();

    if (task && worker) {
      delete this.taskPool[task.uuid];
      delete this.workerPool[worker.id];

      this.executeTaskWithWorker(task, worker);
    }
  }

  /**
   * Sends a task to a worker to be executed
   *
   * @param task - The task that is to be run
   * @param worker - The worker that it should be executed on
  */

  executeTaskWithWorker(task: Task, worker: Worker) {
    worker.emit('exec', task);

    this.logger.debug(`Executing task (${task.uuid}) with worker (${worker.id})`);
  }

  /**
   * Gets a task from the task pool (if any exist)
   *
   * @returns A pending task from the task pool
   */

  getTask() {
    const key = Object.keys(this.taskPool)[0];
    if (key) {
      const task = this.taskPool[key];
      return task;
    }

    return;
  }

  /**
   * Gets a worker from the worker pool (if any exist)
   *
   * @returns An inactive worker from the worker pool
   */

  getWorker() {
    const key = Object.keys(this.workerPool)[0];
    if (key) {
      const worker = this.workerPool[key];
      return worker;
    }

    return;
  }

  /**
   * Allows a command to be requested
   *
   * @param cmd - The name of the task to be executed
   * @param args - The arguments for that task
   * @returns - A that promise will resolve or reject depending
   * on the result from the worker.
  */

  executeCommand(cmd: string, args: object): Promise<CommandResult> {
    const uuid = UUID();
    const task = { uuid, cmd, args };

    const promise = new Promise<CommandResult>((resolve, reject) => {
      this.taskPromises[uuid] = [resolve, reject];
    });

    this.addTaskToTaskPool(task);

    return promise;
  }
}
