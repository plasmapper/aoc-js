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
   * @returns {string} Digits.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let digits = input.trim();
    if (!/^\d+$/.test(digits))
      throw new Error("Invalid input data");

    consoleLine.innerHTML += " done.";
    return digits;
  }

  /**
   * Finds the number of digits after 40 (part 1) or 50 (part 2) look-and-say rounds.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of digits after 40 (part 1) or 50 (part 2) look-and-say rounds.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let digits = this.parse(input);
      let numberOfRounds = part == 1 ? 40 : 50;

      let solConsole = this.solConsole;

      for (let round = 0; round < numberOfRounds; round++) {
        let newDigits = "";
        for (let i = 1, iStart = 0; i <= digits.length; i++) {
          if (i == digits.length || digits[i] != digits[i - 1]) {
            newDigits += `${i - iStart}${digits[iStart]}`;
            iStart = i;
          }          
        }
        digits = newDigits;
      }

      solConsole.addLine(`Number of digits after ${numberOfRounds} look-and-say rounds: ${digits.length}.`);
      
      return digits.length;
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