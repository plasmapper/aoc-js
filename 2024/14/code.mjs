import { delay, Console, PixelMap, Vector2D, leastCommonMultiple } from "../../utility.mjs";

const robotColorIndex = 1;
const robotColor = "#ffffff";
const quadrantSeparatorColorIndex = 2;
const quadrantSeparatorColor = "#999999";

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
   * @returns {Robot[]} Robots.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let robots = input.trim().split(/\r?\n/).map((line, lineIndex) => {
    let match;
    if ((match = line.match(/^p=(-?\d+),(-?\d+) v=(-?\d+),(-?\d+)$/)) == null)
      throw new Error(`Invalid data in line ${lineIndex + 1}`);
    return new Robot(new Vector2D(parseInt(match[1]), parseInt(match[2])), new Vector2D(parseInt(match[3]), parseInt(match[4])));
  });

  consoleLine.innerHTML += " done.";
  return robots;
}

  /**
   * Calculates the safety factor (part 1) or finds the number of seconds after which the Christmas tree appears (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Safety factor (part 1) or the number of seconds after which the Christmas tree appears (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let robots = this.parse(input);
      let mapWidth = robots.length <= 12 ? 11 : 101;
      let mapHeight = robots.length <= 12 ? 7 : 103;
      let mapCenterX = Math.floor(mapWidth / 2);
      let mapCenterY = Math.floor(mapHeight / 2);
      let numberOfSeconds = 100;

      let solConsole = this.solConsole;

      let pixelMap = new PixelMap(mapWidth, mapHeight);
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[robotColorIndex] = robotColor;
        pixelMap.palette[quadrantSeparatorColorIndex] = quadrantSeparatorColor;
      }

      // Calculate the safety factor (part 1)
      if (part == 1) {
        // Move robots
        for (let i = 0; i < numberOfSeconds; i++) {
          if (visualization) {
            for (let robot of robots)
              pixelMap.drawPixel(robot.position.x, robot.position.y, 0);
          }
          
          for (let robot of robots)
            robot.move(mapWidth, mapHeight);
          
          if (visualization) {
            for (let robot of robots)
              pixelMap.drawPixel(robot.position.x, robot.position.y, robotColorIndex);
            await delay(1);
          }
        }

        // Calculate the safety factor
        let quadrants = [0, 0, 0, 0];
        for (let robot of robots) {
          if (robot.position.x < mapCenterX) {
            if (robot.position.y < mapCenterY)
              quadrants[0]++;
            if (robot.position.y > mapCenterY)
              quadrants[2]++;
          }

          if (robot.position.x > mapCenterX) {
            if (robot.position.y < mapCenterY)
              quadrants[1]++;
            if (robot.position.y > mapCenterY)
              quadrants[3]++;
          }
        }

        if (visualization) {
          for (let x = 0; x < mapWidth; x++)
            pixelMap.drawPixel(x, mapCenterY, quadrantSeparatorColorIndex);
          for (let y = 0; y < mapHeight; y++)
            pixelMap.drawPixel(mapCenterX, y, quadrantSeparatorColorIndex);
        }

        return quadrants.reduce((acc, e) => acc * e, 1);
      }
      
      // Find the number of seconds after which the Christmas tree appears (part 2)   
      else {
        // Find the common period of movement for all robots
        let period = 1;
        for (let robot of robots) {
          robot.move(mapWidth, mapHeight);
          while (!robot.position.equals(robot.startPosition)) {
            robot.move(mapWidth, mapHeight);
            robot.period++;
          }
          period = leastCommonMultiple(period, robot.period);
        }

        numberOfSeconds = period - 1;

        // Find the distribution with minimum dispersion
        let dispersionSums = [];
        for (let i = 0; i < numberOfSeconds; i++) {
          let meanX = 0, meanY = 0;
          let dispersionX = 0, dispersionY = 0;

          // Move robots
          for (let robot of robots)
            robot.move(mapWidth, mapHeight);

          // Calculate mean X and Y
          for (let robot of robots) {
            meanX += robot.position.x;
            meanY += robot.position.y;
          }
          meanX /= robots.length;
          meanY /= robots.length;

          // Calculate X and Y dispersion
          for (let robot of robots) {
            dispersionX += robot.position.x * robot.position.x;
            dispersionY += robot.position.y * robot.position.y;
          }
          dispersionX = dispersionX / robots.length - meanX * meanX;
          dispersionY = dispersionY / robots.length - meanY * meanY;

          dispersionSums.push(dispersionX + dispersionY);
        }

        // Find the step with minimum dispersion sum
        let minDispersionNumberOfSeconds = dispersionSums.indexOf(Math.min(...dispersionSums)) + 1;

        solConsole.addLine(`The robot distribution dispersion sum is minimal after ${minDispersionNumberOfSeconds} seconds.`);
  
        if (visualization) {
          for (let robot of robots) {
            robot.position = robot.startPosition.clone();
            robot.move(mapWidth, mapHeight, minDispersionNumberOfSeconds)
            pixelMap.drawPixel(robot.position.x, robot.position.y, robotColorIndex);
          }
        }     
  
        return minDispersionNumberOfSeconds;
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
}

/**
 * Puzzle robot class.
 */
class Robot {
  /**
   * @param {Vector2D} startPosition Start position.
   * @param {Vector2D} velocity Velocity.
   */
  constructor(startPosition, velocity) {
    /**
     * Start position
     * @type {Vector2D}
     */
    this.startPosition = startPosition;
    /**
     * Position.
     * @type {Vector2D}
     */
    this.position = startPosition.clone();
    /**
     * Velocity.
     * @type {Vector2D}
     */
    this.velocity = velocity;
    /**
     * Period.
     * @type {number}
     */
    this.period = 1;
  }

  /**
   * Moves the robot.
   * @param {number} mapWidth Map width.
   * @param {number} mapHeight Map height.
   * @param {number} numberOfSteps Number of steps.
   */
  move(mapWidth, mapHeight, numberOfSteps = 1) {
    this.position.add(this.velocity.clone().multiply(numberOfSteps));
    this.position.x %= mapWidth;
    if (this.position.x < 0)
      this.position.x += mapWidth;
    this.position.y %= mapHeight;
    if (this.position.y < 0)
      this.position.y += mapHeight;
  }
}