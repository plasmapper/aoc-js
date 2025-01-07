import { delay, Console, linearSystemSolution } from "../../utility.mjs";

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
   * @returns {string} Strings.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let strings = input.trim().split(/\r?\n/).map((line, index) => {
      if (!/^[a-z]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return line;
    });

    consoleLine.innerHTML += " done.";
    return strings;
  }

  /**
   * Calculates the number of nice strings.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of nice strings.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let strings = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let numberOfNiceStrings = 0;
      for (let string of strings) {
        let stringIsNice;
        if (part == 1)
          stringIsNice = /[aeiou].*[aeiou].*[aeiou]/.test(string) && /(.)\1/.test(string) && !/(ab)|(cd)|(pq)|(xy)/.test(string);
        else
          stringIsNice = /(..).*\1/.test(string) && /(.).\1/.test(string);

        if (stringIsNice)
          numberOfNiceStrings++;

        if (visualization) {
          visConsole.addLine(string);
          if (stringIsNice)
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
        }
      }

      return numberOfNiceStrings;
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