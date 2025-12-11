import { delay, Console } from "../../utility.mjs";

export default class  {
  /**
   * @param {Console} solConsole Solution console.
   * @param {HTMLElement} visContainer Visualization container.
   */
  constructor(solConsole, visContainer) {
    this.isSolving = false;
    this.isStopping = false;
    this.solConsole = typeof solConsole !== "undefined" ? solConsole : new Console();
    this.visContainer = visContainer;
  }
  
  /**
    * Parses the puzzle input.
    * @param {string} input Puzzle input.
    * @returns {Device[]} Devices.
    */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let devices = [];
    
    input.trim().split(/\r?\n/).forEach((line, index) => {
      if (!/^[a-z]+:( [a-z]+)+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      let lineElements = line.replace(":", "").split(" ");

      let device = devices.find(e => e.name == lineElements[0]);
      if (device == undefined)
        devices.push(device = new Device(lineElements[0]));
      
      for (let i = 1; i < lineElements.length; i++) {
        if (device.outputs.find(e => e.name == lineElements[i]) != undefined)
          throw new Error(`Device \"${lineElements[i]}\" is listed as an output of device \"${lineElements[i]}\" more than once`);
        let output = devices.find(e => e.name == lineElements[i]);
        if (output == undefined)
          devices.push(output = new Device(lineElements[i]));
        device.outputs.push(output);
      }
    });

    consoleLine.innerHTML += " done.";
    return devices;
  }

  /**
   * Finds the number of different paths from "you" to "out" (part 1) or the number of different paths from "svr" to "out" that visit both "dac" and "fft" (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of different paths from "you" to "out" (part 1) or the number of different paths from "svr" to "out" that visit both "dac" and "fft" (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let devices = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Find the number of paths between all pairs of devices
      for (let device of devices) {
        for (let output of device.outputs) {
          for (let [origin, numberOfPathsFromOriginToDevice] of device.originMap) {
            for (let [destination, numberOfPathsFromOutputToDestination] of output.destinationMap) {
              let numberOfPathsFromOriginToDestination = origin.destinationMap.get(destination);
              if (numberOfPathsFromOriginToDestination == undefined)
                numberOfPathsFromOriginToDestination = 0;
              numberOfPathsFromOriginToDestination += numberOfPathsFromOriginToDevice * numberOfPathsFromOutputToDestination;
              origin.destinationMap.set(destination, numberOfPathsFromOriginToDestination);
              destination.originMap.set(origin, numberOfPathsFromOriginToDestination);
            }
          }
        }
      }

      if (part == 1) {
        let [youDevice, outDevice] = ["you", "out"].map(deviceName => {
          let device = devices.find(e => e.name == deviceName);
          if (device == undefined)
            throw new Error(`Device "${deviceName}" not found`);
          return device;
        });

        let [numberOfPathsFromYouToOut] = [[youDevice, outDevice]].map(e => {
          let numberOfPaths = e[0].destinationMap.get(e[1]);
          return numberOfPaths == undefined ? 0 : numberOfPaths;
        });

        if (visualization) {
          visConsole.addLine(`Number of paths from "you" to "out": ${numberOfPathsFromYouToOut}.`);
          visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
        }

        return numberOfPathsFromYouToOut;
      }
      else {
        let [svrDevice, dacDevice, fftDevice, outDevice] = ["svr", "dac", "fft", "out"].map(deviceName => {
          let device = devices.find(e => e.name == deviceName);
          if (device == undefined)
            throw new Error(`Device "${deviceName}" not found`);
          return device;
        });

        let [numberOfPathsFromSvrToDac, numberOfPathsFromSvrToFft, numberOfPathsFromDacToFft, numberOfPathsFromFftToDac, numberOfPathsFromDacToOut, numberOfPathsFromFftToOut] =
          [[svrDevice, dacDevice], [svrDevice, fftDevice], [dacDevice, fftDevice], [fftDevice, dacDevice], [dacDevice, outDevice], [fftDevice, outDevice]].map(e => {
            let numberOfPaths = e[0].destinationMap.get(e[1]);
            return numberOfPaths == undefined ? 0 : numberOfPaths;
        });

        // Only one term is non-zero
        let numberOfPathsFromSvrToOutThroughDacAndFft =
          numberOfPathsFromSvrToDac * numberOfPathsFromDacToFft * numberOfPathsFromFftToOut + numberOfPathsFromSvrToFft * numberOfPathsFromFftToDac * numberOfPathsFromDacToOut;
        if (visualization) {
          visConsole.addLine(`Number of paths from "svr" to "dac": ${numberOfPathsFromSvrToDac}.`);
          visConsole.addLine(`Number of paths from "svr" to "fft": ${numberOfPathsFromSvrToFft}.`);
          visConsole.addLine(`Number of paths from "dac" to "fft": ${numberOfPathsFromDacToFft}.`);
          visConsole.addLine(`Number of paths from "fft" to "dac": ${numberOfPathsFromFftToDac}.`);
          visConsole.addLine(`Number of paths from "dac" to "out": ${numberOfPathsFromDacToOut}.`);
          visConsole.addLine(`Number of paths from "fft" to "out": ${numberOfPathsFromFftToOut}.`);
          visConsole.addLine();
          visConsole.addLine(`Number of paths from "svr" to "out" that visit both "dac" and fft": ${numberOfPathsFromSvrToOutThroughDacAndFft}.`);
          visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
        }

        return numberOfPathsFromSvrToOutThroughDacAndFft;
      }
    }
    
    finally {
      this.isSolving = false;
    }
  }

  /**
   * Stops solving the puzzle.
   */
  async stopSolving() {
    this.isStopping = true;
    while (this.isSolving)
      await(delay(10));
    this.isStopping = false;
  }
}

/**
 * Puzzle device class.
 */
class Device {
  /**
   * @param {string} name Name.
   */
  constructor(name) {
    /**
     * Name.
     * @type {string}
     */
    this.name = name;
    /**
     * Outputs.
     * @type {Device[]}
     */
    this.outputs = [];
    /**
     * Map of possible destinations as keys and the numbers of paths to those destinations as values.
     * @type {Map<Device, number>}
     */
    this.destinationMap = new Map([[this, 1]]);
    /**
     * Map of possible origins as keys and the numbers of paths from those origins as values.
     * @type {Map<Device, number>}
     */
    this.originMap = new Map([[this, 1]]);
  }
}