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
   * @returns {number[]} Digits.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    input = input.trim();
    if (!/^\d+$/.test(input))
      throw new Error("Invalid input data")

    let digits = input.split("").map(e => parseInt(e));

    consoleLine.innerHTML += " done.";
    return digits;
  }

  /**
   * Finds the solution to the captcha.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Solution to the captcha.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let digits = this.parse(input);

      if (digits.length % 2 != 0)
        throw new Error("Number of digits is odd");

      let visConsole = new Console();
      let visConsoleLine;
      if (visualization) {
        this.visContainer.append(visConsole.container);
        visConsoleLine = visConsole.addLine();
        visConsoleLine.style.overflowWrap = "break-word";
      }

      let captcha = 0;

      for (let i = 0; i < digits.length; i++) {
        if ((part == 1 && digits[i] == digits[(i + 1) % digits.length]) || (part == 2 && digits[i] == digits[(i + digits.length / 2) % digits.length])) {
          captcha += digits[i];
          if (visualization)
            visConsoleLine.innerHTML += `<span class="highlighted">${digits[i]}</span>`;
        }
        else if (visualization)
          visConsoleLine.innerHTML += digits[i];
      }

      return captcha;
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