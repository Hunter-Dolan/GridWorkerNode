import minimist from 'minimist';
import GridWorker from '../lib';

import { BigNumber } from 'bignumber.js';

/**
 * This is an example file to demonstrate how to use GridWorker
 * It will search for primes based on a pre-defined set of rules
*/

export default class GridWorkerExample {
  worker: GridWorker;

  constructor() {
    // GridWorker takes a config on init, we're just going to load
    // our config from the CLI flags.
    const args = minimist(process.argv.slice(2));

    // Create a GridWorker instance
    this.worker = new GridWorker(args);
  }

  /**
   * Called to start work
  */

  exec() {
    // Determine our mode and do our thing
    if (this.worker.config.mode === 'server') {
      this.startServer();
      return;
    }

    this.startWorker();
  }

  /**
   * Starts the GridWorker server
   *This is where the work is delegated from
  */

  async startServer() {
    // Start the Grid Server
    this.worker.startServer();

    // Define how many tasks we're going to run
    const taskCount = 64;

    // Define how many numbers should be searched for in each task
    const taskRange = 256;

    // Determine how large our task buffer will be
    const bufferedTasks = 16;

    // Setup some storage vars to aid in the addTask function
    let lastIndex = 0;
    let foundPrimes:string[] = [];

    // Count the number of tasks that are actively running
    let outstandingTasks = 0;

    // This function will add a task to the task buffer
    const addTask = async () => {
      const index = lastIndex;

      // If our index is greater than the task count
      if (index > taskCount) {

        // If there are no more outstanding tasks, we can wrap things up
        if (outstandingTasks === 0) {

          // Sort the primes since they can come in out of order
          foundPrimes = foundPrimes.sort((a, b) => {
            const bigA = new BigNumber(a);
            const bigB = new BigNumber(b);

            const diff = bigA.minus(bigB);
            if (diff.isZero()) {
              return 0;
            }

            if (diff.isPositive()) {
              return 1;
            }

            return -1;
          });

          // Write the primes.txt file
          const fs = require('fs');
          fs.writeFile('./primes.txt', foundPrimes.join('\n'), (err: any) => {
            console.log(err);
          });
        }

        // Exit this function
        return;
      }

      // Otherwise, increase the index
      lastIndex++;

      // Setup a new argument object for the worker
      const args = {
        offset: new BigNumber(taskRange).times(index).toString(),
        range: taskRange,
      };

      // Increase our outstanding tasks
      outstandingTasks++;

      // Async await for the the task to complete
      const commandResult = await this.worker.executeCommand('findPrimes', args);

      // Decrease our outstanding tasks (it is complete)
      outstandingTasks--;

      // If the command result is valid, add it to found primes
      if (commandResult) {
        foundPrimes = foundPrimes.concat(commandResult.primes);
      }

      // Add another task to the task buffer
      addTask();
    };

    // Add a pre defined number of tasks to the task buffer so that they can
    // be executed in parallel
    for (let i = 0; i < bufferedTasks; i++) {
      addTask();
    }
  }

  /**
   * Starts the GridWorker worker
   * This is where work is actually performed
  */

  startWorker() {
    const findPrimes = (input: { [key: string]: any }) => {

      // Get the big num lib to show full numbers
      BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

      //
      // Determines if a BigNumber is prime for numbers 3 and up
      // Note: 2 and below will not behave as expected
      //

      const isPrimeOptimized = (num: BigNumber) => {
        for (let i = new BigNumber(3); i.isLessThan(num); i = i.plus(1)) {
          if (num.mod(i).isZero()) {
            return false;
          }
        }

        return true;
      };

      // Extract our input
      const { offset, range } = input;

      // Convert the offset to a BigNumber
      const offsetBigNum = new BigNumber(offset);

      // We only need half the range given since we're excluding
      // every even number in our search
      const rangeHalf = Math.ceil(parseFloat(range) / 2.0);

      // Since we only are looking for odd numbers, we need to check
      // if the initial offset given is even, it shouldn't be, but we might as well check
      const offsetIsEven = offsetBigNum.mod(2).isZero();

      // If it is, lets make it odd
      let bigOffsetOdd = offsetIsEven ? offsetBigNum.plus(1) : offsetBigNum;

      // Create a storage array for the primes we find
      const primes = [];

      // If the number is equal to zero, we know that 2 is a prime
      // It's our only even prime and our check won't find it, so we're just going
      // to add it to the array
      if (bigOffsetOdd.isEqualTo(1) || offsetBigNum.isEqualTo(2)) {
        primes.push("2");

        bigOffsetOdd = new BigNumber(3);
      }

      // Loop through each number by the range and determine the primes
      for (let i = 0; i < rangeHalf; i++) {
        const num = bigOffsetOdd.plus(i * 2);
        console.log(num.toString());
        if (isPrimeOptimized(num)) {
          console.log("Found!", num.toString());
          primes.push(num.toString());
        }
      }

      // Return the time results
      return { primes };
    };

    this.worker.registerCommand('findPrimes', findPrimes);

    this.worker.connectToServer();
  }
}

// Initialize a new Example Instance
const runner = new GridWorkerExample();

// Run!
runner.exec();
