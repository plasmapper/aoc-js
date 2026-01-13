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
   * @returns {{
   * generatorAStartingValue: number,
   * generatorBStartingValue: number
   * }} Generator A starting value and generator B starting value.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let lines = input.trim().split(/\r?\n/);

    if (lines.length != 2)
      throw new Error("Invalid input data");
    let match = lines[0].match(/^Generator A starts with (\d+)$/);
    if (match == null)
      throw new Error(`Invalid data in line 1`);
    let startingValueA = parseInt(match[1]);
    match = lines[1].match(/^Generator B starts with (\d+)$/);
    if (match == null)
      throw new Error(`Invalid data in line 1`);
    let startingValueB = parseInt(match[1]);

    consoleLine.innerHTML += " done.";
    return {startingValueA, startingValueB};
  }


  /**
   * Finds the number of times the lowest 16 bits of the generator value pairs match.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of times the lowest 16 bits of the generator value pairs match.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {startingValueA, startingValueB} = this.parse(input);
      let factorA = 16807, factorB = 48271, divisor = 2147483647, numberOfPairs = (startingValueA == 65 && startingValueB == 8921) ? (part == 1 ? 5 : 1056) : (part == 1 ? 40000000 : 5000000);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let valueA = startingValueA, valueB = startingValueB;
      let numberOfMatches = 0;
      for (let i = 0; i < numberOfPairs; i++) {
        if (part == 1) {
          valueA = (valueA * factorA) % divisor;
          valueB = (valueB * factorB) % divisor;
        }
        else {
          for (valueA = (valueA * factorA) % divisor; valueA % 4 != 0; valueA = (valueA * factorA) % divisor);
          for (valueB = (valueB * factorB) % divisor; valueB % 8 != 0; valueB = (valueB * factorB) % divisor);
        }
        
        if ((valueA & 0xFFFF) == (valueB & 0xFFFF))
          numberOfMatches++;
      }

      if (visualization)
        visConsole.addLine(`The first ${numberOfPairs} generator value pairs have <span class="highlighted">${numberOfMatches}</span> match${numberOfMatches == 1 ? "" : "es"} of the lowest 16 bits.`);
      
      return numberOfMatches;
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