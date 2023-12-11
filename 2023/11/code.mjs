import { delay, Console, Vector2D } from "../../utility.mjs";

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
   * @returns {Vector2D[]} Start coordinates.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let stars = [];
    input.trim().split(/\r?\n/).forEach((line, y) => {
      if (!/^[.#]+$/.test(line))
        throw new Error(`Invalid data in line ${y + 1}`);

      for (let [x, symbol] of line.split("").entries()) {
        if (symbol == "#")
          stars.push(new Vector2D(x, y));
      }
    });

    consoleLine.innerHTML += " done.";
    return stars;
  }

  /**
   * Finds the sum of distances between the stars.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The sum of distances between the stars.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let stars = this.parse(input);
      let starsSortedByX = stars.slice().sort((s1, s2) => s1.x - s2.x);
      let starsSortedByY = stars.slice().sort((s1, s2) => s1.y - s2.y);
      
      // Expand the space
      let expansionCoefficient = part == 1 ? 2 : (stars.length < 10 ? 100 : 1000000);
      let x = 0, dX = 0;
      for (let star of starsSortedByX) {
        if (star.x > x + 1)
          dX += (star.x - x - 1) * (expansionCoefficient - 1);
        x = star.x;
        star.x += dX;
      }

      let y = 0, dY = 0;
      for (let star of starsSortedByY) {
        if (star.y > y + 1)
          dY += (star.y - y - 1) * (expansionCoefficient - 1);
        y = star.y;
        star.y += dY;
      }

      let solConsole = this.solConsole;
      solConsole.addLine(`Number of stars: ${stars.length}.`)
      solConsole.addLine(`Expansion coefficient: ${expansionCoefficient}.`)

      if (visualization) {
        let visConsole = new Console();
        this.visContainer.append(visConsole.container);
        for (let [starIndex, star] of stars.entries())
          visConsole.addLine(`Star ${starIndex + 1}: X = ${star.x}, Y = ${star.y}.`);
      }

      // Calculate distances
      let sumOfDistances = 0;
      for (let star1 of stars) {
        for (let star2 of stars)
          sumOfDistances += star1.clone().subtract(star2).manhattanLength();
      }

      sumOfDistances /= 2;
      
      return sumOfDistances;
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
