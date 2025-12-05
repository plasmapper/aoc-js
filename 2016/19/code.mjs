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
   * @returns {number} Number of elves.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let line = input.trim();
    if (!/^\d+$/.test(line) || parseInt(line) == 0)
      throw new Error("Invalid input data");

    consoleLine.innerHTML += " done.";
    return parseInt(line);
  }

  /**
   * Finds the position of the elf that gets all the presents.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Position of the elf that gets all the presents.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let numberOfElves = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let elves = new Array(numberOfElves);
      for (let i = 0; i < numberOfElves; i++)
        elves[i] = new Elf(i + 1);
      for (let i = 0; i < numberOfElves - 1; i++) {
        elves[i].nextElf = elves[i + 1];
        elves[i + 1].previousElf = elves[i];
      }
      elves[numberOfElves - 1].nextElf = elves[0];
      elves[0].previousElf = elves[numberOfElves - 1];

      let elf = elves[0];
      let elfToTakePresentsFrom = elf.nextElf;
      if (part == 2) {
        for (let i = 1; i < Math.floor(numberOfElves / 2); i++)
          elfToTakePresentsFrom = elfToTakePresentsFrom.nextElf;
      }

      for (; numberOfElves > 1; numberOfElves--) {
        elfToTakePresentsFrom.previousElf.nextElf = elfToTakePresentsFrom.nextElf;
        elfToTakePresentsFrom.nextElf.previousElf = elfToTakePresentsFrom.previousElf;

        // In part 1 the next elf to take presents from is 2 positions from the current one
        // In part 2 the next elf to take presents from is 1 position from the current one if the number of elves is even and 2 positions if the number of elves is odd
        elfToTakePresentsFrom = part == 2 && numberOfElves % 2 == 0 ? elfToTakePresentsFrom.nextElf : elfToTakePresentsFrom.nextElf.nextElf;
      }

      if (visualization)
        visConsole.addLine(`Elf ${elfToTakePresentsFrom.position} gets all the presents.`)

      return elfToTakePresentsFrom.position;
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
 * Puzzle elf class.
 */
class Elf {
  /**
   * @param {number} position Position.
   */
  constructor(position) {
    /**
     * Position.
     * @type {number}
     */
    this.position = position;
    /**
     * Next elf.
     * @type {Elf}
     */
    this.nextElf = null;
    /**
     * Previous elf.
     * @type {Elf}
     */
    this.previousElf = null;
  }
}