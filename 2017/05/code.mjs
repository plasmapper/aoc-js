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
   * @returns {number[]} Instructions.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let instructions = input.trim().split(/\r?\n/).map((line, index) => {
      if (!/^-?\d+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return parseInt(line);
    });

    consoleLine.innerHTML += " done.";
    return instructions;
  }


  /**
   * Finds the number of steps to reach the exit.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of valid passphrases.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let instructions = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let step = 0;
      for (let i = 0; i >= 0 && i < instructions.length; step++) {
        let jump = instructions[i];
        instructions[i] += (part == 1 ? 1 : (instructions[i] >= 3 ? -1 : 1));
        i += jump;
      }
      
      if (visualization)
        visConsole.addLine(`The exit is reached in ${step} steps.`);

      return step;
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