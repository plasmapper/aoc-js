import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

const obstacleColorIndex = 1;
const obstacleColor = "#999999";
const pathColorIndex = 2;
const pathColor = "#ffffff";
const startColorIndex = 3;
const startColor = "#00aa00";
const endColorIndex = 4;
const endColor = "#ffff00";
const blockingObstacleColorIndex = 5;
const blockingObstacleColor = "#ff0000";

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
   * @returns {Vector2D[]} Bytes.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let bytes = input.trim().split(/\r?\n/).map((line, index) => {
    let match;
    if ((match = line.match(/^(\d+),(\d+)$/)) == null)
      throw new Error(`Invalid data in line ${index + 1}`);
    return new Vector2D(parseInt(match[1]), parseInt(match[2]));
  });

  consoleLine.innerHTML += " done.";
  return bytes;
}

  /**
   * Calculates the minimum number of steps to reach the exit (part 1) or finds the coordinates of the first byte that will prevent the exit from being reachable (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number|string} Minimum number of steps to reach the exit (part 1) or the coordinates of the first byte that will prevent the exit from being reachable (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let bytes = this.parse(input);
      let mapWidth = bytes.length < 30 ? 7 : 71;
      let mapHeight = mapWidth;
      let start = new Vector2D(0, 0);
      let end = new Vector2D(mapWidth - 1, mapHeight - 1);

      let pixelMap = new PixelMap(mapWidth, mapHeight);
 
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[obstacleColorIndex] = obstacleColor;
        pixelMap.palette[pathColorIndex] = pathColor;
        pixelMap.palette[startColorIndex] = startColor;
        pixelMap.palette[endColorIndex] = endColor;
        pixelMap.palette[blockingObstacleColorIndex] = blockingObstacleColor;
  
        pixelMap.drawPixel(start.x, start.y, startColorIndex);
        pixelMap.drawPixel(end.x, end.y, endColorIndex);
      }

      //Calculate the minimum number of steps to reach the exit (part 1)
      if (part == 1) {
        bytes = bytes.slice(0, bytes.length < 30 ? 12 : 1024);

        let route = this.findRoute(mapWidth, mapHeight, start, end, bytes);
        if (route == null)
          throw new Error("Route not found");

        if (visualization) {
          if (part == 1)
            bytes.forEach(byte => pixelMap.drawPixel(byte.x, byte.y, obstacleColorIndex));
  
          for (let position of route) {
            if (this.isStopping)
              return;
            if (!position.equals(start) && !position.equals(end))
              pixelMap.drawPixel(position.x, position.y, pathColorIndex);
            await delay(1);
          }
        }

        return route.length - 1;
      }
      
      // Find the coordinates of the first byte that will prevent the exit from being reachable (part 2).
      else {
        let route;
        let blockingByte;
        for (; bytes.length > 0 && (route = this.findRoute(mapWidth, mapHeight, start, end, bytes)) == null; blockingByte = bytes.pop());

        if (route == null)
          throw new Error("Route not found");
        if (blockingByte == undefined)
          throw new Error("Blocking byte not found");

        if (visualization) {
          for (let byte of bytes)
            pixelMap.drawPixel(byte.x, byte.y, obstacleColorIndex);
          pixelMap.drawPixel(blockingByte.x, blockingByte.y, blockingObstacleColorIndex)
          pixelMap.drawPixel(bytes.x, start.y, 0);
          pixelMap.drawPixel(start.x, start.y, 0);
          pixelMap.fill(start.x, start.y, pathColorIndex);
          pixelMap.drawPixel(start.x, start.y, startColorIndex);
        }
        
        return `${blockingByte.x},${blockingByte.y}`;
      }
    }
    
    finally {
      this.isSolving = false;
    }
  }

  /**
   * Finds the route from start to end.
   * @param {number} mapWidth Map width.
   * @param {number} mapHeight Map height.
   * @param {Vector2D} start Start.
   * @param {Vector2D} end End.
   * @param {Vector2D[]} bytes Byte coordinates.
   * @returns {Vector2D[]} Route or null if route is not found.
   */
  findRoute(mapWidth, mapHeight, start, end, bytes) {
    let map = [];
    for (let i = 0; i < mapHeight; i++)
      map.push(new Array(mapWidth).fill(0));
    for (let byte of bytes)
      map[byte.y][byte.x] = 1;

    let routes = [[start]];
    let directions = [new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(-1, 0), new Vector2D(0, -1)];

    while (routes.length > 0) {
      let newRoutes = [];
      for (let route of routes) {
        let lastPosition = route[route.length - 1];
        for (let direction of directions) {
          let newPosition = lastPosition.clone().add(direction);
          if (newPosition.x >= 0 && newPosition.x < mapWidth && newPosition.y >= 0 && newPosition.y < mapHeight && map[newPosition.y][newPosition.x] == 0) {
            let newRoute = route.slice();
            newRoute.push(newPosition);
            if (newPosition.x == end.x && newPosition.y == end.y)
              return newRoute;
            newRoutes.push(newRoute);
            map[newPosition.y][newPosition.x] = 1;
          }
        }
      }
      routes = newRoutes;
    }

    return null;
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