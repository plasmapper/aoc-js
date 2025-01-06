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
    this.noPart2 = true;
  }
  
  /**
   * Parses the puzzle input.
   * @param {string} input Puzzle input.
   * @returns {string[]} SNAFU numbers.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let snafuNumbers = input.trim().split(/\r?\n/).map((line, lineIndex) => {
      if (!/^[012\-=]+$/.test(line))
        throw new Error(`Invalid data in line ${lineIndex + 1}`);
      return line;
    });
    
    consoleLine.innerHTML += " done.";
    return snafuNumbers;
  }

  /**
   * Finds the sum of SNAFU numbers.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string} Sum of SNAFU numbers.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let snafuNumbers = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Convert SNAFU numbers to decimal numbers
      let decimalNumbers = snafuNumbers.map(snafu => snafu.split("").reverse().reduce((acc, e, i) =>
        acc + (e == "=" ? -2 : (e == "-" ? -1 : parseInt(e))) * Math.pow(5, i), 0));
      
      // Calcualte the sum of decimal numbers
      let decimalSum = decimalNumbers.reduce((acc, e) => acc + e, 0);

      // Convert the decimal sum to a SNAFU number
      let snafuSum = "";
      for (let sum = decimalSum; sum > 0; sum = Math.floor(sum / 5)) {
        let remainder = sum % 5;
        if (remainder == 0 || remainder == 1 || remainder == 2)
          snafuSum += `${remainder}`;
        if (remainder == 3) {
          snafuSum += "=";
          sum += 2;
        }
        if (remainder == 4) {
          snafuSum += "-";
          sum++;
        }
      }
      snafuSum = snafuSum.split("").reverse().join("");

      if (visualization) {
        for (let i = 0; i < snafuNumbers.length; i++)
          visConsole.addLine(`${snafuNumbers[i]} (${decimalNumbers[i]})`);
        visConsole.addLine(`Sum: ${snafuSum} (${decimalSum}).`);
        visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
      }

      return snafuSum;
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