import { delay, Console } from "../../utility.mjs";

export default class {
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
   * @returns {Disk[]} Disks.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let disks = input.trim().split(/\r?\n/).map((line, index) => {
      let match;
      if ((match = line.match(new RegExp(`^Disc #${index + 1} has (\\d+) positions; at time=0, it is at position (\\d+).$`))) == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      let disk = new Disk(parseInt(match[1]), parseInt(match[2]));
      if (disk.numberOfPositions < 1 || disk.startPosition >= disk.numberOfPositions)
        throw new Error(`Disk ${index + 1} parameters are invalid`);
      return disk;
    });

    consoleLine.innerHTML += " done.";
    return disks;
  }

  /**
   * Finds the first time to press the button so that the capsule goes through the disks.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} First time to press the button so that the capsule goes through the disks.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let disks = this.parse(input);

      if (part == 2)
        disks.push(new Disk(11, 0));

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let diskIndexWithMaxNumberOfPositions = disks.reduce((acc, e, i) => e.numberOfPositions > disks[acc].numberOfPositions ? i : acc, 0);
      let diskWithMaxNumberOfPositions = disks[diskIndexWithMaxNumberOfPositions];
      let time = (diskIndexWithMaxNumberOfPositions + 1 + diskWithMaxNumberOfPositions.startPosition) % diskWithMaxNumberOfPositions.numberOfPositions;
      if (time != 0)
        time = diskWithMaxNumberOfPositions.numberOfPositions - time;
      for (; !disks.every((disk, i) => (time + (i + 1) + disk.startPosition) % disk.numberOfPositions == 0); time += diskWithMaxNumberOfPositions.numberOfPositions);

      if (visualization) {
        let t = time - 1;
        visConsole.addLine(`Time=${++t}:`);
        visConsole.addLine("Capsule starts to fall.");
        visConsole.addLine();
        for (let i = 0; i < disks.length; i++) {
          visConsole.addLine(`Time=${++t}:`);
          visConsole.addLine(`Disk #${i + 1} position: (${disks[i].startPosition} + ${t}) % ${disks[i].numberOfPositions} = 0.`);
          visConsole.addLine(`Capsule goes through disk #${i + 1}.`);
          visConsole.addLine();
        }
      }

      return time;
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
 * Puzzle disk class.
 */
class Disk {
  /**
   * @param {number} numberOfPositions Number of positions.
   * @param {number} startPosition Start position.
   */
  constructor(numberOfPositions, startPosition) {
    /**
     * Number of positions.
     * @type {number}
     */
    this.numberOfPositions = numberOfPositions;
    /**
     * Start position.
     * @type {number}
     */
    this.startPosition = startPosition;
  }
}