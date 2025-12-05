import { delay, Console, PixelMap } from "../../utility.mjs";

const trapColorIndex = 1;
const trapColor = "#999999";

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
   * @returns {number[]} First row.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let line = input.trim();
    if (!/^[\.\^]+$/.test(line))
      throw new Error("Invalid input data");
    let firstRow = line.split("").map(e => e == "^" ? trapColorIndex : 0);

    consoleLine.innerHTML += " done.";
    return firstRow;
  }

  /**
   * Finds the number of safe tiles.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of safe tiles.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let firstRow = this.parse(input);
      let mapWidth = firstRow.length;
      let mapHeight = firstRow.length < 20 ? 10 : (part == 1 ? 40 : 400000);
      
      let pixelMap, visConsole;
      if (visualization) {
        if (part == 1) {
          pixelMap = new PixelMap(mapWidth, mapHeight);
          this.visContainer.append(pixelMap.container);
          pixelMap.palette[trapColorIndex] = trapColor;
        }
        else {
          visConsole = new Console();
          this.visContainer.append(visConsole.container);
        }
      }

      let totalNumberOfSafeTiles = 0;
      for (let y = 0, row = firstRow; y < mapHeight; y++) {
        if (this.isStopping)
          return;

        if (visualization && part == 1) {
          row.forEach((e, x) => pixelMap.drawPixel(x, y, e));
          await delay(20);
        }

        let numberOfSafeTiles = 0;
        row = row.map((e, x, row) => {
          if (e == 0)
            numberOfSafeTiles++;
          return (x == 0 ? 0 : row[x - 1]) != (x == mapWidth - 1 ? 0 : row[x + 1]) ? trapColorIndex : 0;
        });
        totalNumberOfSafeTiles += numberOfSafeTiles;

        if (visualization && part == 2) {
          visConsole.addLine(`Row ${y + 1}: ${numberOfSafeTiles} safe tiles.`);
        }
      }

      return totalNumberOfSafeTiles;
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