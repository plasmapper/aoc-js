import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

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
   * @returns {Vector[]} Move vectors.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let moveVectors = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match = line.match(/^([LRUD]) (\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      let distance = parseInt(match[2]);

      for (let i = 0; i < Math.abs(distance); i++) {
        let x = match[1] == "L" ? -1 : (match[1] == "R" ? 1 : 0);
        let y = match[1] == "U" ? -1 : (match[1] == "D" ? 1 : 0);
        moveVectors.push(new Vector2D(x, y));
      }
    });

    consoleLine.innerHTML += " done.";
    return moveVectors;
  }

  /**
   * Counts the number of positions the tail of the rope visits at least once.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of positions the tail of the rope visits at least once.
   */
  async solve(part, input, visualization) {
    const ropeHeadColorIndex = 1;
    const ropeBodyColorIndex = 2;
    const ropeTailColorIndex = 3;
    const ropeHeadColor = "#00aa00";
    const ropeBodyColor = "#008000";
    const ropeTailColor = "#ffffff";
    
    try {
      this.isSolving = true;

      let moveVectors = this.parse(input);
      let ropeSize = part == 1 ? 2 : 10;
      let rope = new Rope(0, 0, ropeSize);

      // Find the map boundaries
      let mapMinX = 0, mapMaxX = 0, mapMinY = 0, mapMaxY = 0;
      for (let vector of moveVectors)  {
        rope.move(vector);
        mapMinX = Math.min(mapMinX, rope.knots[0].x);
        mapMaxX = Math.max(mapMaxX, rope.knots[0].x);
        mapMinY = Math.min(mapMinY, rope.knots[0].y);
        mapMaxY = Math.max(mapMaxY, rope.knots[0].y);
      }

      let mapWidth = mapMaxX - mapMinX + 1;
      let mapHeight = mapMaxY - mapMinY + 1;

      let solConsole = this.solConsole;
      let pixelMap = new PixelMap(mapWidth, mapHeight);

      solConsole.addLine(`Number of steps: ${moveVectors.length}.`);
      let solConsoleLine = solConsole.addLine();

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[ropeHeadColorIndex] = ropeHeadColor;
        pixelMap.palette[ropeBodyColorIndex] = ropeBodyColor;
        pixelMap.palette[ropeTailColorIndex] = ropeTailColor;
      }

      // Find the tail coordinates along the route
      rope = new Rope(-mapMinX, -mapMinY, ropeSize);

      for (let [stepIndex, vector] of moveVectors.entries()) {
        if (this.isStopping)
          return 0;

        // Remove previous rope
        if (visualization) {
          for (let i = 0; i < rope.size - 1; i++) {
            let knot = rope.knots[i];
            if (pixelMap.image[knot.y][knot.x] != ropeTailColorIndex)
              pixelMap.drawPixel(knot.x, knot.y, 0);
          }
        }

        rope.move(vector);
        // Draw tail position
        pixelMap.drawPixel(rope.knots[rope.size - 1].x, rope.knots[rope.size - 1].y, ropeTailColorIndex);

        solConsoleLine.innerHTML = `Step: ${stepIndex + 1}.`;

        // Draw new rope
        if (visualization) {
          for (let i = rope.size - 2; i >= 0; i--) {
            let knot = rope.knots[i];
            if (pixelMap.image[knot.y][knot.x] != ropeTailColorIndex)
              pixelMap.drawPixel(knot.x, knot.y, i ? ropeBodyColorIndex : ropeHeadColorIndex);
          }
          await delay(stepIndex % 5 == 0 ? 1 : 0);
        }
      }

      return pixelMap.image.reduce((lineAcc, line) => lineAcc + line.reduce((acc, e) => acc + (e == ropeTailColorIndex ? 1 : 0), 0), 0);
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

/**
 * Puzzle rope class.
 */
class Rope {
  /**
   * @param {number} x X coordinate of all knots.
   * @param {number} y Y coordinate of all knots
   * @param {number} size Rope size.
   */
  constructor(x, y, size) {
    /**
     * Rope size.
     * @type {number}
     */
    this.size = size;

    /**
     * Rope knots.
     * @type {Vector2D[]}
     */
    this.knots = [];
    for (let i = 0; i < this.size; i++)
      this.knots.push(new Vector2D(x, y));
  }

  /**
   * Moves the head and the rest of the rope.
   * @param {Vector} vector Head movement vector.
   */
  move(vector) {
    this.knots[0].add(vector);
    for (let i = 1; i < this.size; i++) {
      let distance = this.knots[i - 1].clone().subtract(this.knots[i]);
      if (Math.abs(distance.x) > 1 || Math.abs(distance.y) > 1)
        this.knots[i].add(new Vector2D(Math.sign(distance.x), Math.sign(distance.y)));
    }
}
}