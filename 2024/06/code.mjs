import { delay, Console, PixelMap, Vector2D, Range2D } from "../../utility.mjs";

const obstacleColorIndex = 1;
const obstacleColor = "#999999";
const startColorIndex = 2;
const startColor = "#ffff00";
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
   * @returns {{
   * mapWidth: number,
   * mapHeight: number,
   * obstacles: Vector2D[],
   * guardPosition: Vector2D,
   * guardDirection: Vector2D
   * }} Map width, map height, obstacles, guard position and guard direction.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let mapWidth = 0, mapHeight = 0;
    let obstacles = [];
    let initialGuardPositions = [];
    let initialGuardDirections = [];
    
    input.trim().split(/\r?\n/).forEach((line, y, lines) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${y + 1}`);
      mapWidth = line.length;
      mapHeight++;
      line.split("").forEach((symbol, x) => {
        if (!/^[\.#<>v\^]+$/.test(line))
          throw new Error(`Invalid data in line ${y + 1}`);
        if (symbol == "#")
          obstacles.push(new Vector2D(x, y));
        if ("><v^".includes(symbol)) {
          initialGuardPositions.push(new Vector2D(x, y));
          initialGuardDirections.push(new Vector2D(symbol == ">" ? 1 : (symbol == "<" ? -1 : 0), symbol == "v" ? 1 : (symbol == "^" ? -1 : 0)));
        }
      });
    });

    if (initialGuardPositions.length == 0)
      throw new Error(`Guard not found`);
    if (initialGuardPositions.length > 1)
      throw new Error(`More than one guard found`);
    let initialGuardPosition = initialGuardPositions[0];
    let initialGuardDirection = initialGuardDirections[0];

    consoleLine.innerHTML += " done.";
    return { mapWidth, mapHeight, obstacles, initialGuardPosition, initialGuardDirection };
  }

  /**
   * Finds the number of guard positions (part 1) or number of new obstacles that cycle the guard (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of guard positions (part 1) or number of new obstacles that cycle the guard (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let { mapWidth, mapHeight, obstacles, initialGuardPosition, initialGuardDirection } = this.parse(input);
      let mapCoordinateRange = new Range2D(0, mapWidth - 1, 0, mapHeight - 1);

      let pixelMap = new PixelMap(mapWidth, mapHeight);

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[obstacleColorIndex] = obstacleColor;
        pixelMap.palette[startColorIndex] = startColor;
        pixelMap.palette[pathColorIndex] = pathColor;
        pixelMap.palette[newObstacleColorIndex] = newObstacleColor;

        obstacles.forEach(obstacle => pixelMap.drawPixel(obstacle.x, obstacle.y, obstacleColorIndex));
        pixelMap.drawPixel(initialGuardPosition.x, initialGuardPosition.y, startColorIndex);
      }

      let initialObstacleSet = new Set();
      for (let obstacle of obstacles)
        initialObstacleSet.add(obstacle.y * mapWidth + obstacle.x);

      // Find guard route
      let route = this.findRoute(mapCoordinateRange, initialObstacleSet, initialGuardPosition, initialGuardDirection);
      //if (mapCoordinateRange.contains(route[route.length - 1]))
        //throw new Error("Initial route of the guard has a loop");
      route = route.slice(0, route.length - 1);

      // Find unique positions of the guard route
      let uniquePositions = route.reduce((acc, position) => {
        if (acc.find(p => p.equals(position)) == undefined)
          acc.push(position);
        return acc
      }, []);

      // Find the number of guard positions (part 1)
      if (part == 1) {
        if (visualization) {
          for (let position of route) {
            if (this.isStopping)
              return;
            if (!position.equals(initialGuardPosition)) {}
              pixelMap.drawPixel(position.x, position.y, pathColorIndex);
            await delay(1);
          }
        }
      
        return uniquePositions.length;
      }
      
      // Find the number of new obstacles that cycle the guard (part 2)
      else {
        uniquePositions = uniquePositions.filter(position => !position.equals(initialGuardPosition));

        let numberOfNewObstacles = 0;
        for (let newObstacle of uniquePositions) {
          if (this.isStopping)
            return;
          let obstacleSet = new Set(initialObstacleSet);
          obstacleSet.add(newObstacle.y * mapWidth + newObstacle.x);
          let route = this.findRoute(mapCoordinateRange, obstacleSet, initialGuardPosition, initialGuardDirection);
          if (mapCoordinateRange.contains(route[route.length - 1])) {
            if (visualization) {
              pixelMap.drawPixel(newObstacle.x, newObstacle.y, newObstacleColorIndex);
              await delay(1);
            }
            numberOfNewObstacles++;
          }
        }

        return numberOfNewObstacles;
      }
    }

    finally {
      this.isSolving = false;
    }
  }

  /**
   * Finds the guard route.
   * @param {Range2D} mapCoordinateRange Map coordinate range.
   * @param {Set<number>} obstacleSet Obstacles (y * mapWidth + x).
   * @param {Vector2D} initialPosition Initial guard position.
   * @param {Vector2D} initialDirection Initial guard direction.
   * @returns {Vector2D[]} Route positions.
   */
  findRoute(mapCoordinateRange, obstacleSet, initialPosition, initialDirection) {
    let position = initialPosition.clone();
    let direction = initialDirection.clone();
    let positionDirectionSet = new Set();
    let positionDirectionHash = (pos, dir) => (pos.y * (mapCoordinateRange.x.to + 1) + pos.x) * 100 + (dir.y + 2) * 10 + dir.x + 2;

    let route = [initialPosition.clone()];
    
    while (mapCoordinateRange.contains(position) && !positionDirectionSet.has(positionDirectionHash(position, direction))) {
      positionDirectionSet.add(positionDirectionHash(position, direction));
      let newPosition = position.clone().add(direction);
      if (!mapCoordinateRange.contains(newPosition) || !obstacleSet.has(newPosition.y * (mapCoordinateRange.x.to + 1) + newPosition.x)) {
        position = newPosition;
        route.push(newPosition);
      }
      else {
        if (direction.x == 1)
          direction = new Vector2D(0, 1);
        else if (direction.x == -1)
          direction = new Vector2D(0, -1);
        else if (direction.y == 1)
          direction = new Vector2D(-1, 0);
        else if (direction.y == -1)
          direction = new Vector2D(1, 0);
      }
    }

    return route;
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