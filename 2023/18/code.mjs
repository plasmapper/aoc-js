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
   * @returns {Trench} Trench.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let part1DigSteps = [];
    let part2DigSteps = [];
    
    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match = line.match(/^([LRUD]) (\d+) \(#([0-9a-f]{5})([0-3])\)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);

      let part1Direction = new Vector2D(match[1] == "R" ? 1 : (match[1] == "L" ? -1 : 0), match[1] == "D" ? 1 : (match[1] == "U" ? -1 : 0));
      part1DigSteps.push(new DigStep(part1Direction, parseInt(match[2])));
      
      let part2Direction = new Vector2D(match[4] == "0" ? 1 : (match[4] == "2" ? -1 : 0), match[4] == "1" ? 1 : (match[4] == "3" ? -1 : 0));
      part2DigSteps.push(new DigStep(part2Direction, parseInt(match[3], 16)));
    });

    consoleLine.innerHTML += " done.";
    return new Trench(part1DigSteps, part2DigSteps);
  }

  /**
   * Calculates the volume of the trench.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Volume of the trench.
   */
  async solve(part, input, visualization) {
    const trenchColorIndex = 1;
    const trenchColor = "#ffffff";

    try {
      this.isSolving = true;

      let steps = part == 1 ? this.parse(input).part1Steps : this.parse(input).part2Steps;

      let clockWiseTurns = [];

      // Find direction of every turn
      for (let i = 0; i < steps.length - 1; i++)
        clockWiseTurns.push(steps[i + 1].direction.x == -steps[i].direction.y && steps[i + 1].direction.y == steps[i].direction.x);
      clockWiseTurns.push(steps[0].direction.x == -steps[steps.length - 1].direction.y && steps[0].direction.y == steps[steps.length - 1].direction.x);

      let trenchIsClockwise = clockWiseTurns.reduce((acc, e) => acc + e ? 1 : -1, 0) > 0;

      // Vary lengths of segments based on turn directions
      let corners = [new Vector2D(0, 0)];
      
      let lastTurnWasSameAsTrench = true;
      for (let i = 0; i < steps.length; i++) {
        corners.push(corners[corners.length - 1].clone().add(steps[i].direction.clone().multiply(steps[i].distance)));

        if ((clockWiseTurns[i] && trenchIsClockwise) || (!clockWiseTurns[i] && !trenchIsClockwise)) {
          if (lastTurnWasSameAsTrench)
            corners[corners.length - 1].add(steps[i].direction);
          lastTurnWasSameAsTrench = true;
        }
        else {
          if (!lastTurnWasSameAsTrench)
            corners[corners.length - 1].subtract(steps[i].direction);
          lastTurnWasSameAsTrench = false;
        }
      }

      // Shoelace formula
      let area = 0;
      for (let i = 0; i < corners.length - 1; i++) {
        let x1 = corners[i].x;
        let y1 = corners[i].y;
        let x2 = corners[i + 1].x;
        let y2 = corners[i + 1].y;
        area += x1 * y2 - x2 * y1;
      }
      area /= 2;
      

      if (visualization) {
        let corners = [new Vector2D(0, 0)];
      
        for (let i = 0; i < steps.length; i++)
          corners.push(corners[corners.length - 1].clone().add(steps[i].direction.clone().multiply(steps[i].distance)));

        let minX = corners.reduce((acc, e) => Math.min(acc, e.x), 0);
        let minY = corners.reduce((acc, e) => Math.min(acc, e.y), 0);
        let maxX = corners.reduce((acc, e) => Math.max(acc, e.x), 0);
        let maxY = corners.reduce((acc, e) => Math.max(acc, e.y), 0);
        let divider = Math.ceil(Math.max(maxX - minX + 1, maxY - minY + 1) / 500);

        corners.forEach(corner => { corner.x = Math.floor ((corner.x - minX) / divider); corner.y = Math.floor ((corner.y - minY) / divider); });

        let points = [];
        for (let i = 0; i < corners.length - 1; i++) {
          for (let point = corners[i]; !point.equals(corners[i + 1]); point = point.clone().add(steps[i].direction))
            points.push(point);
        }

        let mapWidth = points.reduce((acc, e) => Math.max(acc, e.x), points[0].x) + 1;
        let mapHeight = points.reduce((acc, e) => Math.max(acc, e.y), points[0].y) + 1;

        let pixelMap = new PixelMap(mapWidth, mapHeight);

        this.visContainer.append(pixelMap.container);
        pixelMap.palette[trenchColorIndex] = trenchColor;

        for (let point of points)
          pixelMap.drawPixel(point.x, point.y, trenchColorIndex);
      }

      return area;
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
 * Puzzle digging step class.
 */
class DigStep {
  /**
   * @param {Vector2D} direction Direction.
   * @param {number} distance Distance.
   */
  constructor(direction, distance) {
    /**
     * Direction.
     * @type {Vector2D}
     */
    this.direction = direction;
    /**
     * Distance;
     * @type {number}
     */
    this.distance = distance;
  }
}

/**
 * Puzzle trench class.
 */
class Trench {
  /**
   * @param {DigStep[]} part1Steps Digging steps for part 1.
   * @param {DigStep[]} part2Steps Digging steps for part 2.
   */
  constructor(part1Steps, part2Steps) {
    /**
     *  Digging steps for part 1.
     * @type {DigStep[]}
     */
    this.part1Steps = part1Steps;
    /**
     *  Digging steps for part 2.
     * @type {DigStep[]}
     */
    this.part2Steps = part2Steps;
  }
}