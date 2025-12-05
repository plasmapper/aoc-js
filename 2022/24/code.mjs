import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

const obstacleColorIndex = 1;
const obstacleColor = "#999999";
const pathColorIndex = 2;
const pathColor = "#ffffff";
const blizzardColorIndex = 3;
const blizzardColor = "#00aa00";

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
   * @returns {{
   * mapWidth: number,
   * mapHeight: number,
   * horizontalBlizzardMap: Set<number>[][],
   * verticalBlizzardMap: Set<number>[][],
   * }} Map width and height, horizontal and vertical blizzard maps (sets of remainders of time divided by blizzard map dimension for the position to have a blizzard).
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let lines = input.trim().split(/\r?\n/)
    let mapWidth = lines[0].length;
    let mapHeight = 0;
    let horizontalBlizzardMap = [];
    let verticalBlizzardMap = [];

    lines.forEach((line, index) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);
      if (index == 0 && !/^#\.#+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      if (index == lines.length - 1 && !/^#+\.#$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      if (index != 0 && index != lines.length - 1 && !/^#[\.<>\^v]+#$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      horizontalBlizzardMap.push(new Array(mapWidth).fill(0).map(e => new Set()));
      verticalBlizzardMap.push(new Array(mapWidth).fill(0).map(e => new Set()));
      mapHeight++;
    });


    lines.forEach((line, y) => {
      line.split("").forEach((symbol, x) => {
        if (symbol == ">" || symbol == "<") {
          for (let i = 0; i < mapWidth - 2; i++)
            horizontalBlizzardMap[y][i + 1].add(((symbol == ">" ? i - (x - 1) : (x - 1) - i) + mapWidth - 2) % (mapWidth - 2));
        }
        if (symbol == "v" || symbol == "^") {
          for (let i = 0; i < mapHeight - 2; i++)
            verticalBlizzardMap[i + 1][x].add(((symbol == "v" ? i - (y - 1) : (y - 1) - i) + mapHeight - 2) % (mapHeight - 2));
        }
      });
    });

    consoleLine.innerHTML += " done.";
    return { mapWidth, mapHeight, horizontalBlizzardMap, verticalBlizzardMap };
  }

  /**
   * Calculates the number of minutes to reach the goal (part 1) or the number of minutes to reach the goal, go back to the start and reach the goal again (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The number of minutes to reach the goal (part 1) or the number of minutes to reach the goal, go back to the start and reach the goal again (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let { mapWidth, mapHeight, horizontalBlizzardMap, verticalBlizzardMap } = this.parse(input);

      let pixelMap = new PixelMap(mapWidth, mapHeight);
 
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[obstacleColorIndex] = obstacleColor;
        pixelMap.palette[pathColorIndex] = pathColor;
        pixelMap.palette[blizzardColorIndex] = blizzardColor;

        for (let x = 2; x < mapWidth; x++)
          pixelMap.drawPixel(x, 0, obstacleColorIndex);
        for (let x = 1; x < mapWidth - 2; x++)
          pixelMap.drawPixel(x, mapHeight - 1, obstacleColorIndex);
        for (let y = 0; y < mapHeight; y++) {
          pixelMap.drawPixel(0, y, obstacleColorIndex);
          pixelMap.drawPixel(mapWidth - 1, y, obstacleColorIndex);
        }
      }

      let time = 0;
      let route = [new Vector2D(1, 0)];
      // Routes map (key: last position hash, value: route)
      let routesMap = new Map();
      routesMap.set(1, route);
      let destinations = part == 1 ? [new Vector2D(mapWidth - 2, mapHeight - 1)] :
        [new Vector2D(mapWidth - 2, mapHeight - 1), new Vector2D(1, 0), new Vector2D(mapWidth - 2, mapHeight - 1)];

      for (let destination of destinations) {
        let destinationKey = destination.y * mapWidth + destination.x;
        for (; routesMap.size > 0 && !routesMap.has(destinationKey); time++) {
          let newRoutesMap = new Map();
          let horizontalRemainder = (time + 1) % (mapWidth - 2);
          let verticalRemainder = (time + 1) % (mapHeight - 2);
  
          for (let [key, route] of routesMap) {
            // Find new routes and add them to the route map
            [new Vector2D(0, 0), new Vector2D(1, 0), new Vector2D(-1, 0), new Vector2D(0, 1), new Vector2D(0, -1)].map(dir => dir.add(route[route.length - 1])).filter(position => {
              if (position.x < 1 || position.x > mapWidth - 2 || position.y < 0 || position.y > mapHeight - 1)
                return false;
              if ((position.y == 0 && position.x != 1) || (position.y == mapHeight - 1 && position.x != mapWidth - 2))
                return false;
              return !horizontalBlizzardMap[position.y][position.x].has(horizontalRemainder) && !verticalBlizzardMap[position.y][position.x].has(verticalRemainder);
            }).forEach(position => {
              let newRoute = route.slice();
              newRoute.push(position);
              newRoutesMap.set(position.y * mapWidth + position.x, newRoute);
            });
          }
  
          routesMap = newRoutesMap;
        }

        if (routesMap.size == 0)
          throw new Error("Route not found");

        // Add found route part to the entire route and set the current destination as a new starting point
        let routePart = routesMap.get(destinationKey);
        route.push(...routePart.slice(1))
        routesMap = new Map();
        routesMap.set(destinationKey, [destination]);
      }

      if (visualization) {
        for (let time = 0; time < route.length; time++) {
          if (this.isStopping)
            return;

          let horizontalRemainder = time % (mapWidth - 2);
          let verticalRemainder = time % (mapHeight - 2);

          if (time > 0)
            pixelMap.drawPixel(route[time - 1].x, route[time - 1].y, 0);

          for (let y = 1; y < mapHeight - 1; y++) {
            for (let x = 1; x < mapWidth - 1; x++)
              pixelMap.drawPixel(x, y, horizontalBlizzardMap[y][x].has(horizontalRemainder) || verticalBlizzardMap[y][x].has(verticalRemainder) ? blizzardColorIndex : 0);
          }

          pixelMap.drawPixel(route[time].x, route[time].y, pathColorIndex);
  
          await delay(1);
        }
      }

      return route.length - 1;
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