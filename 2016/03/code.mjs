import { delay, Console, Vector2D } from "../../utility.mjs";

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
   * @returns {number[][]} Side groups.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let lines = input.trim().split(/\r?\n/);
    if (lines.length % 3 != 0)
      throw new Error(`Number of lines is not a multiple of 3.`);
    let sideGroups = lines.map((line, index) => {
      let match = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    });

    consoleLine.innerHTML += " done.";
    return sideGroups;
  }

  /**
   * Finds the number of valid triangles.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of valid triangles.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let sideGroups = this.parse(input);

      if (part == 2) {
        let transposedSideGroups = [];
        for (let i = 0; i < sideGroups.length; i += 3) {
          transposedSideGroups.push([sideGroups[i][0], sideGroups[i + 1][0], sideGroups[i + 2][0]]);
          transposedSideGroups.push([sideGroups[i][1], sideGroups[i + 1][1], sideGroups[i + 2][1]]);
          transposedSideGroups.push([sideGroups[i][2], sideGroups[i + 1][2], sideGroups[i + 2][2]]);
        }
        sideGroups = transposedSideGroups;
      }

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let numberOfvalidTriangles = 0;

      for (let sideGroup of sideGroups) {
        let sortedSideGroup = sideGroup.slice().sort((a, b) => (a - b));

        if (visualization)
          visConsole.addLine(sideGroup.join(" "));

        if (sortedSideGroup[2] < sortedSideGroup[0] + sortedSideGroup[1]) {
          numberOfvalidTriangles++;
          if (visualization)
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
        }
      }

      return numberOfvalidTriangles;
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