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
   * @returns {number[][]} Spreadsheet.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let spreadsheet = input.trim().split(/\r?\n/).map((line, index) => {
      line = line.replaceAll(/\s+/g, " ");
      if (!/^[\s\d]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return line.split(" ").map(e => parseInt(e));
    });

    consoleLine.innerHTML += " done.";
    return spreadsheet;
  }

  /**
   * Finds the sum of each row's difference between max and min values (part 1) or sum of each row's result of division of two evenly divisible values (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of each row's difference between max and min values (part 1) or sum of each row's result of division of two evenly divisible values (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let spreadsheet = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let sum = 0;

      for (let row of spreadsheet) {
        if (part == 1) {
          let minValue = Math.min(...row);
          let maxValue = Math.max(...row);
          sum += (maxValue - minValue);

          if (visualization) {
            visConsole.addLine(row.map(e => e == minValue ? `<span class="highlighted">${e}</span>` : (e == maxValue ? `<span class="strongly-highlighted">${e}</span>` : e)).join(" "));
            visConsole.lines[visConsole.lines.length - 1].style.whiteSpace = "nowrap";
          }
        }
        else {
          let valuePair = null;
          for (let i = 0; i < row.length && valuePair == null; i++) {
            for (let j = 0; j < row.length && valuePair == null; j++) {
              if (i != j && row[i] % row[j] == 0)
                valuePair = [row[i], row[j]];
            }
          }

          if (valuePair == null)
            throw new Error("Solution not found");
          
          sum += valuePair[0] / valuePair[1];

          if (visualization) {
            visConsole.addLine(row.map(e => e == valuePair[1] ? `<span class="highlighted">${e}</span>` : (e == valuePair[0] ? `<span class="strongly-highlighted">${e}</span>` : e)).join(" "));
            visConsole.lines[visConsole.lines.length - 1].style.whiteSpace = "nowrap";
          }
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