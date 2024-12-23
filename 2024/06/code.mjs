import { delay, Console, PixelMap, Vector2D, Range2D } from "../../utility.mjs";

const obstacleColorIndex = 1;
const obstacleColor = "#999999";
const guardColorIndex = 2;
const guardColor = "#ffff00";
const pathColorIndex = 3;
const pathColor = "#ffffff";
const newObstacleColorIndex = 4;
const newObstacleColor = "#00aa00";

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
   * @returns {Map} Map.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let obstacles = [];
    let guardPosition = null;
    let guardDirection = null;
    
    input.trim().split(/\r?\n/).forEach((line, lineIndex) => {
      let obstaclesRow = [];

      if (lineIndex != 0 && line.length != obstacles[0].length)
        throw new Error(`Invalid length of line ${lineIndex + 1}`);

      line.split("").forEach((symbol, symbolIndex) => {
        if (symbol == "#")
          obstaclesRow.push(1);
        else {
          obstaclesRow.push(0);

          if (symbol != ".") {
            if (symbol == ">" || symbol == "<" || symbol == "v" || symbol == "^") {
              if (guardPosition != null)
                throw new Error(`More than one guard found`);
              guardPosition = new Vector2D(symbolIndex, lineIndex);
              if (symbol == ">")
                guardDirection = new Vector2D(1, 0);
              if (symbol == "<")
                guardDirection = new Vector2D(-1, 0);
              if (symbol == "v")
                guardDirection = new Vector2D(0, 1);
              if (symbol == "^")
                guardDirection = new Vector2D(0, -1);
            }
            else
              throw new Error(`Invalid data in line ${lineIndex + 1}`);
          }
        }
      });

      obstacles.push(obstaclesRow);
    });

    if (guardPosition == null)
      throw new Error(`Guard not found`);

    consoleLine.innerHTML += " done.";
    return new Map(obstacles, guardPosition, guardDirection);
  }

  /**
   * Finds the number of guard positions (part 1) or number of new obstacles (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of guard positions (part 1) or number of new obstacles (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let initialMap = this.parse(input);
      let mapWidth = initialMap.defaultObstacles[0].length;
      let mapHeight = initialMap.defaultObstacles.length;

      let solConsole = this.solConsole;

      let pixelMap = new PixelMap(mapWidth, mapHeight);

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[obstacleColorIndex] = obstacleColor;
        pixelMap.palette[guardColorIndex] = guardColor;
        pixelMap.palette[pathColorIndex] = pathColor;
        pixelMap.palette[newObstacleColorIndex] = newObstacleColor;
      }
      pixelMap.draw(initialMap.defaultObstacles);

      let solConsoleLine = solConsole.addLine();

      // Find the number of guard positions (part 1)
      if (part == 1) {
        let numberOfGuardPositions = 0;
        for (let step = 1; !initialMap.guardIsOutside; initialMap.guardStep(), step++) {
          if (this.isStopping)
            return;
  
          if (visualization) {
            pixelMap.drawPixel(initialMap.guardPosition.x, initialMap.guardPosition.y, guardColorIndex);
            await delay(1);
            pixelMap.drawPixel(initialMap.guardPosition.x, initialMap.guardPosition.y, pathColorIndex);
          }
  
          if (!initialMap.guardIsOutside && initialMap.guardDirections[initialMap.guardPosition.y][initialMap.guardPosition.x].length == 0)
            numberOfGuardPositions++;
  
          solConsoleLine.innerHTML = `Number of guard positions: ${numberOfGuardPositions}.`;
        }
  
        return numberOfGuardPositions;
      }
      
      // Find the number of new obstacles (part 2)
      else {
        let numberOfNewObstacles = 0;

        let maps = [initialMap];

        while (maps.length) {
          if (this.isStopping)
            return;
          
          // Add a new map with obstacle
          if (!initialMap.guardIsOutside) {
            let newMap = new Map(initialMap.defaultObstacles, initialMap.guardPosition.clone(), initialMap.guardDirection,
              initialMap.guardDirections.map(line => line.map(directions => directions.slice())));
      
            let newObstacle = initialMap.guardPosition.clone().add(newMap.guardDirection);
            
            // New obstacle is inside the map
            if (initialMap.mapCoordinateRange.contains(newObstacle)
              // There is no obstacle yet
              && !initialMap.defaultObstacles[newObstacle.y][newObstacle.x]
              // New obstacle is not on the previous path of the guard
              && initialMap.guardDirections[newObstacle.y][newObstacle.x].length == 0) {

              newMap.newObstacle = newObstacle;
              maps.push(newMap);
            }
          }

          let newMaps = [];
          for (let map of maps) {
            map.guardStep();

            if (!map.guardIsOutside) {
              if (map.guardIsCycled) {
                numberOfNewObstacles++;

                if (visualization) {
                  pixelMap.drawPixel(map.newObstacle.x, map.newObstacle.y, newObstacleColorIndex);
                  await delay(1);
                }
              }
              else
                newMaps.push(map);
            }
          }

          maps = newMaps;

          solConsoleLine.innerHTML = `Number of new obstacles: ${numberOfNewObstacles}.`;
        }

        return numberOfNewObstacles;
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
 * Puzzle map class.
 */
class Map {
  /**
   * @param {number[][]} defaultObstacles Default obstacles.
   * @param {Vector2D} guardPosition Guard position.
   * @param {Vector2D} guardDirection Guard direction.
   * @param {Vector2D[][][]} guardDirections Guard directions.
   */
  constructor(defaultObstacles, guardPosition, guardDirection, guardDirections) {
    /**
     * Default obstacles.
     * @type {number[][]}
     */
    this.defaultObstacles = defaultObstacles;
    /**
     * Guard position.
     * @type {Vector2D}
     */
    this.guardPosition = guardPosition;
    /**
     * Guard direction.
     * @type {Vector2D}
     */
    this.guardDirection =  guardDirection;
    /**
     * Guard directions.
     * @type {Vector2D[][][]}
     */
    if (guardDirections === undefined)
      this.guardDirections = defaultObstacles.map(line => line.map(e => []));
    else
    this.guardDirections = guardDirections;
    /**
     * New obstacle.
     * @type {Vector2D}
     */
    this.newObstacle = undefined;
    
    this.mapCoordinateRange = new Range2D(0, defaultObstacles[0].length - 1, 0, defaultObstacles.length - 1);
    this.guardIsOutside = false;
    this.guardIsCycled = false;
  }

  /**
   * Executes the guard step.
   */
  guardStep() {
    if (this.guardIsOutside || this.guardIsCycled)
      return;

    this.guardDirections[this.guardPosition.y][this.guardPosition.x].push(this.guardDirection);

    let newGuardDirection = this.guardDirection;
    let newGuardPosition = this.guardPosition.clone().add(newGuardDirection);

    while (this.mapCoordinateRange.contains(newGuardPosition)
      && (this.defaultObstacles[newGuardPosition.y][newGuardPosition.x] || (this.newObstacle !== undefined && this.newObstacle.equals(newGuardPosition)))) {

      if (newGuardDirection.x == 1)
        newGuardDirection = new Vector2D(0, 1);
      else if (newGuardDirection.x == -1)
        newGuardDirection = new Vector2D(0, -1);
      else if (newGuardDirection.y == 1)
        newGuardDirection = new Vector2D(-1, 0);
      else if (newGuardDirection.y == -1)
        newGuardDirection = new Vector2D(1, 0);
      newGuardPosition = this.guardPosition.clone().add(newGuardDirection);
    }

    if (this.guardDirection.equals(newGuardDirection))
      this.guardPosition = newGuardPosition;
    this.guardDirection = newGuardDirection;
    this.guardIsOutside = !this.mapCoordinateRange.contains(this.guardPosition);
    
    if (!this.guardIsOutside && this.guardDirections[this.guardPosition.y][this.guardPosition.x].find(direction => direction.equals(this.guardDirection)) != undefined)
      this.guardIsCycled = true;
  }
}
