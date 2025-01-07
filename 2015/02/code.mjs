import { delay, Console, Vector3D } from "../../utility.mjs";

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
   * @returns {Vector3D[]} Boxes.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let boxes = input.trim().split(/\r?\n/).map((line, index) => {
      let match;
      if ((match = line.match(/^(\d+)x(\d+)x(\d+)$/)) == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return new Vector3D(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    });

    consoleLine.innerHTML += " done.";
    return boxes;
  }

  /**
   * Calculates the area of the wrapping paper (part 1) or the length of the ribbon (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Area of the wrapping paper (part 1) or the length of the ribbon (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let boxes = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let totalArea = 0;
      let totalLength = 0;
      for (let box of boxes) {
        // Calculate the area of the wrapping paper
        if (part == 1) {
          let areas = [box.x * box.y, box.y * box.z, box.x * box.z];
          let area = areas.reduce((acc, e) => acc + 2 * e, 0) + Math.min(...areas);
          if (visualization)
            visConsole.addLine(`Box ${box.x}x${box.y}x${box.z}: ${area} sq ft.`);
          totalArea += area;
        }
        // Calculate the length of the ribbon
        else {
          let sides = [box.x, box.y, box.z];
          sides.sort((a, b) => (a - b));
          let length = sides[0] * 2 + sides[1] * 2 + box.x * box.y * box.z;
          if (visualization)
            visConsole.addLine(`Box ${box.x}x${box.y}x${box.z}: ${length} ft.`);
          totalLength += length;
        }
      }

      return part == 1 ? totalArea : totalLength;
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