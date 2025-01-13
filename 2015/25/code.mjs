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
   * @returns {{
   * row: number,
   * column: number
   * }} Row and column.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    input = input.trim();
    let match;
    if ((match = input.match(/^To continue, please consult the code grid in the manual\.  Enter the code at row (\d+), column (\d+)\.$/)) == null)
      throw new Error(`Invalid data in line 1`);
    let row = parseInt(match[1]);
    let column = parseInt(match[2]);
    if (row <= 0 || column <= 0)
      throw new Error(`Invalid data in line 1`);
    
    consoleLine.innerHTML += " done.";
    return {row, column};
  }

  /**
   * Finds the code.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Code.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {row, column} = this.parse(input);
      let startCode = 20151125;
      let diagonalNumber = row + column - 1;
      let codeNumber = diagonalNumber * (diagonalNumber - 1) / 2 + column;
     
      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let code = startCode;
      for (let i = 1; i < codeNumber; i++)
        code = (code * 252533) % 33554393;

      if (visualization) {
        visConsole.addLine(`Row: ${row}, column: ${column}.`);
        visConsole.addLine(`Code number: ${codeNumber}.`);
        visConsole.addLine(`Code: ${code}.`);
        visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
      }

      return code;
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