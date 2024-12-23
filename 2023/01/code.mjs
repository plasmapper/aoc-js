import { delay, Console } from "../../utility.mjs";

const digitStringValues = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9};

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
   * @returns {string[]} Lines.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let lines = input.trim().split(/\r?\n/);
    
    consoleLine.innerHTML += " done.";
    return lines;
  }

  /**
   * Calculates the sum of the calibration values.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of the calibration values.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let lines = this.parse(input);

      let visConsole = new Console();

      let sum = 0;

      if (visualization)
        this.visContainer.append(visConsole.container);

      for (let [lineIndex, line] of lines.entries()) {
        if (this.isStopping)
          return;

        let digits = [];
        for (let i = 0; i < line.length; i++) {
          // Find numeric digits
          let digit = parseInt(line.substring(i, i + 1));
          if (!isNaN(digit))
            digits.push({value: digit, start: i, end: i + 1});

          // Find string digits
          if (part == 2) {
            for (let digitString in digitStringValues) {
              if (line.substring(i, i + digitString.length) == digitString)
                digits.push({value: digitStringValues[digitString], start: i, end: i + digitString.length});
            }
          }
        }

        if (!digits.length)
          throw new Error(`Digits not found in line ${lineIndex + 1}`);

        let calibrationValue = digits[0].value * 10 + digits[digits.length - 1].value;
        sum += calibrationValue;

        if (visualization) {
          let visConsoleLine = visConsole.addLine();
          visConsoleLine.innerHTML += line.substring(0, digits[0].start);
          visConsoleLine.innerHTML += `<span class="highlighted">${line.substring(digits[0].start, digits[0].end)}</span>`;
          if (digits.length > 1) {
            visConsoleLine.innerHTML += line.substring(digits[0].end, digits[digits.length - 1].start);
            visConsoleLine.innerHTML += `<span class="highlighted">${line.substring(digits[digits.length - 1].start, digits[digits.length - 1].end)}</span>`;
          }
          visConsoleLine.innerHTML += line.substring(digits[digits.length - 1].end);

          visConsole.addLine(`Calibration value: ${calibrationValue}.`);
          visConsole.addLine();
        }
       }
        
      return sum;
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