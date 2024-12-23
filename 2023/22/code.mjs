import { delay, Console, Range, Renderer, RendererColor, RendererCuboid, Vector3D } from "../../utility.mjs";

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
   * @returns {Brick[]} Bricks.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let bricks = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match = line.match(/^(\d+),(\d+),(\d+)~(\d+),(\d+),(\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);

      let x1 = parseInt(match[1]);
      let y1 = parseInt(match[2]);
      let z1 = parseInt(match[3]);
      let x2 = parseInt(match[4]);
      let y2 = parseInt(match[5]);
      let z2 = parseInt(match[6]);
      let xRange = new Range(Math.min(x1, x2), Math.max(x1, x2));
      let yRange = new Range(Math.min(y1, y2), Math.max(y1, y2));
      let zRange = new Range(Math.min(z1, z2), Math.max(z1, z2));
      bricks.push(new Brick(xRange, yRange, zRange));
    });

    consoleLine.innerHTML += " done.";
    return bricks;
  }

  /**
   * Calculates the number of bricks that can be removed (part 1) or the sum of numbers of bricks that will fall if any one brick is removed (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The number of bricks that can be removed (part 1) or the sum of numbers of bricks that will fall if any one brick is removed (part 2).
   */
  async solve(part, input, visualization) {
    const brickColor = new RendererColor(0, 0.66, 0, 1);
    const highlightColor = new RendererColor(1, 1, 1, 1);

    try {
      this.isSolving = true;

      let bricks = this.parse(input);
      
      // Sort bricks by bottom height
      bricks.sort((b1, b2) => b1.zRange.from - b2.zRange.from);

      let renderer = new Renderer();
      if (visualization) {
        this.visContainer.append(renderer.container);

        for (let brick of bricks) {
          brick.visCuboid = new RendererCuboid(brick.xRange.to - brick.xRange.from + 1, brick.yRange.to - brick.yRange.from + 1, brick.zRange.to - brick.zRange.from + 1, brickColor);
          renderer.addObject(brick.visCuboid);
        }

        this.setCameraPosition(renderer, bricks);
      }
      
      // Let all bricks fall
      let allBricksHaveFallen = false;
      while (!allBricksHaveFallen) {
        if (this.isStopping)
          return;

        allBricksHaveFallen = true;
        for (let brick of bricks) {
          if (this.isStopping)
            return;

          if (!brick.hasFallen) {
            if (brick.zRange.from <= 1)
              brick.hasFallen = true;
            else {
              for (let baseBrick of bricks) {
                if (baseBrick.hasFallen && baseBrick.zRange.to == brick.zRange.from - 1 && brick.xRange.overlap(baseBrick.xRange)[1] != null && brick.yRange.overlap(baseBrick.yRange)[1] != null) {
                  brick.baseBricks.add(baseBrick);
                  baseBrick.supportedBricks.add(brick);
                  brick.hasFallen = true;
                }
              }
              
              if (!brick.hasFallen) {
                allBricksHaveFallen = false;
                brick.zRange.from--;
                brick.zRange.to--;
              }
            }
          }
        }

        if (visualization) {
          for (let brick of bricks) {
            brick.visCuboid.origin.x = brick.xRange.from - 0.5;
            brick.visCuboid.origin.y = brick.yRange.from - 0.5;
            brick.visCuboid.origin.z = brick.zRange.from - 0.5;
          }
          renderer.render();
          await delay(10);
        }
      }

      if (visualization) {
        this.setCameraPosition(renderer, bricks);
        renderer.render();
      }

      // Sort bricks by bottom height
      bricks.sort((b1, b2) => b1.zRange.from - b2.zRange.from);

      // Calculate the number of bricks that can be removed
      if (part == 1) {
        let numberOfBricksThatCanBeRemoved = 0;

        for (let brick of bricks) {
          if (this.isStopping)
            return;

          let canBeRemoved = true;
          for (let supportedBrick of brick.supportedBricks) {
            if (supportedBrick.baseBricks.size == 1)
              canBeRemoved = false;
          }

          if (canBeRemoved) {
            numberOfBricksThatCanBeRemoved++;

            if (visualization) {
              brick.visCuboid.color = highlightColor;
              renderer.render();
              await delay(10);
            }
          }
        }
  
        return numberOfBricksThatCanBeRemoved;
      }
      // Calculate the sum of numbers of bricks that will fall if any one brick is removed
      else {
        let totalNumberOfFallingBricks = 0;
        for (let [brickIndex, removedBrick] of bricks.entries()) {
          if (this.isStopping)
            return;

          let fallingBricks = new Set();
          fallingBricks.add(removedBrick);
          
          for (let brick of bricks) {
            let brickWillFall = brick.zRange.from > 1;
            for (let baseBrick of brick.baseBricks) {
              if (!fallingBricks.has(baseBrick))
                brickWillFall = false;
            }
            if (brickWillFall)
              fallingBricks.add(brick);              
          }

          totalNumberOfFallingBricks += fallingBricks.size - 1;

          if (visualization) {
            for (let brick of bricks)
              brick.visCuboid.color = fallingBricks.has(brick) ? highlightColor : brickColor;
            renderer.render();
            await delay(1);
          }
        }

        return totalNumberOfFallingBricks;
      }
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

  /**
   * Sets renderer camera position.
   * @param {Renderer} renderer 
   * @param {Brick[]} bricks 
   */
  setCameraPosition(renderer, bricks) {
    let xRange = new Range(Number.MAX_VALUE, Number.MIN_VALUE);
    let yRange = new Range(Number.MAX_VALUE, Number.MIN_VALUE);
    let zRange = new Range(Number.MAX_VALUE, Number.MIN_VALUE);
    for (let brick of bricks) {
      xRange.from = Math.min(xRange.from, brick.xRange.from);
      xRange.to = Math.max(xRange.to, brick.xRange.to);
      yRange.from = Math.min(yRange.from, brick.yRange.from);
      yRange.to = Math.max(yRange.to, brick.yRange.to);
      zRange.from = Math.min(zRange.from, brick.zRange.from);
      zRange.to = Math.max(zRange.to, brick.zRange.to);
    }

    renderer.cameraTarget.x = (xRange.from + xRange.to) / 2;
    renderer.cameraTarget.y = (yRange.from + yRange.to) / 2;
    renderer.cameraTarget.z = (zRange.from + zRange.to) / 2 + (zRange.to - zRange.from) * 0.02;
    renderer.cameraPosition = new Vector3D(1, 1, 0.3).multiply(Math.max(xRange.to - xRange.from, yRange.to - yRange.from, zRange.to - zRange.from) * 0.9 + 2).add(renderer.cameraTarget);
    renderer.cameraUpDirection = renderer.cameraTarget.clone().subtract(renderer.cameraPosition).cross(new Vector3D(1, -1, 0)).normalize();
  }
}

/**
 * Puzzle brick class.
 */
class Brick {
  /**
   * @param {Range} xRange X coordinate range.
   * @param {Range} yRange Y coordinate range.
   * @param {Range} zRange Z coordinate range.
   */
  constructor(xRange, yRange, zRange) {
    /**
     * X coordinate range.
     * @type {Range}
     */
    this.xRange = xRange;
    /**
     * Y coordinate range.
     * @type {Range}
     */
    this.yRange = yRange;
    /**
     * Z coordinate range.
     * @type {Range}
     */
    this.zRange = zRange;
    /**
     * The brick has fallen.
     * @type {boolean}
     */
    this.hasFallen = false;
    /**
     * Bricks that support this brick.
     * @type {Set<Brick>}
     */
    this.baseBricks = new Set();
    /**
     * Bricks are supported by this brick.
     * @type {Set<Brick>}
     */
    this.supportedBricks = new Set();
    /**
     * Visualization cuboid.
     * @type {Cuboid}
     */    
    this.visCuboid = null;
  }
}
