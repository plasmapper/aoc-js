import { delay, Console, Vector2D } from "../../utility.mjs";

const wallIndex = 1;
const wallColor = "#999999";
const positionColorIndex = 2;
const positionColor = "#ffffff";

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
   * @returns {string[]} Directions.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let path =  input.trim().split(",").map((step, index) => {
      if (["n", "s", "ne", "nw", "se", "sw"].indexOf(step) < 0)
        throw new Error(`Invalid data in step ${index + 1}`);
      return step;
    });

    consoleLine.innerHTML += " done.";
    return path;
  }

  /**
   * Finds the distance to the end of the path (part 1) or the largest distance from the start along the path (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Distance to the end of the path (part 1) or the largest distance from the start along the path (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let directions = this.parse(input);

      let positions = [new Vector2D(0, 0)];
      let maxDistance = 0, distance = 0;
      for (let direction of directions) {
        positions.push(this.step(positions[positions.length - 1], direction));
        distance = this.distance(positions[0], positions[positions.length - 1]);
        maxDistance = Math.max(maxDistance, distance);
      }

      if (visualization) {
        let visConsole = new Console();
        this.visContainer.append(visConsole.container);
        if (part == 1)
          visConsole.addLine(`Distance from the start to the end of the path: <span class="highlighted">${distance}</span>.`);
        else
          visConsole.addLine(`Largest distance from the start along the path: <span class="highlighted">${maxDistance}</span>.`);
      }

      return part == 1 ? distance : maxDistance;
    }
    
    finally {
      this.isSolving = false;
    }
  }

  /**
   * Finds the new position after the step.
   * @param {Vector2D} position Position before the step.
   * @param {string} direction Direction.
   * @returns {Vector2D} Position after the step.
   */
  step(position, direction) {
    if (direction == "n")
      return new Vector2D(position.x, position.y - 1);
    if (direction == "s")
      return new Vector2D(position.x, position.y + 1);
    if (direction == "ne")
      return new Vector2D(position.x + 1, position.x % 2 == 0 ? position.y - 1 : position.y);
    if (direction == "se")
      return new Vector2D(position.x + 1, position.x % 2 == 0 ? position.y : position.y + 1);
    if (direction == "nw")
      return new Vector2D(position.x - 1, position.x % 2 == 0 ? position.y - 1 : position.y);
    if (direction == "sw")
      return new Vector2D(position.x - 1, position.x % 2 == 0 ? position.y : position.y + 1);
    
    throw new Error("Invalid direction");
  }

  /**
   * Finds the distance between two positions.
   * @param {Vector2D} position1 Position 1.
   * @param {Vector2D} position2 Position 2.
   * @returns {number} Distance.
   */
  distance(position1, position2) {
    if (position1.y <= position2.y)
      return Math.abs(position2.y - (position1.y - Math.floor((Math.abs(position1.x - position2.x) + (position1.x % 2 == 0 ? 1 : 0)) / 2)));
    else
      return Math.abs(position2.y - (position1.y + Math.floor((Math.abs(position1.x - position2.x) + (position1.x % 2 == 0 ? 0 : 1)) / 2)));
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