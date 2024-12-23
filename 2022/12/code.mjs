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
   * @returns {number[][]} Map (0 - start, 1..26 - other points, 27 - end).
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let mapWidth = 0;
    let map = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      if (mapWidth == 0)
        mapWidth = line.length;
      if (line.length != mapWidth)
        throw new Error(`Invalid length of line ${index + 1}`);
      if (!/^[a-zSE]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);

        map.push(line.split("").map(e => e == "S" ? 0 : (e == "E" ? 27 : e.charCodeAt(0) - "a".charCodeAt(0) + 1)));
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds the fewest number of steps from the start to the end (part 1) or from any point with the lowest elevation to the end (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The fewest number of steps from the start to the end (part 1) or from any point with the lowest elevation to the end (part 2).
   */
  async solve(part, input, visualization) {
    const mapGreenColorStep = 9;
    const endColorIndex = 27;
    const endColor = "#ffff66";
    const highlightColorIndex = 28;
    const highlightColor = "#ffffff";

    try {
      this.isSolving = true;

      let map = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;
      let start, end;
      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          if (map[y][x] == 0)
            start = new Vector2D(x, y);
          if (map[y][x] == 27)
            end = new Vector2D(x, y);
        }
      }
      map[start.y][start.x] = 1;

      let solConsole = this.solConsole;
      let pixelMap = new PixelMap(mapWidth, mapHeight);

      let solConsoleLine = solConsole.addLine();

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        for (let i = 1; i <= 26; i++)
          pixelMap.palette[i] = `rgb(0, ${i * mapGreenColorStep}, 0)`;
        pixelMap.palette[endColorIndex] = endColor;
        pixelMap.palette[highlightColorIndex] = highlightColor;

        pixelMap.draw(map);
      }

      let initialPosition = part == 1 ? start : end;
      let destinationElevation = part == 1 ? 27 : 1;
      let routes = [[initialPosition]];
      let visitedPoints = map.map(line => line.map(e => 0));
      visitedPoints[initialPosition.y][initialPosition.x] = true;

      for (let stepNumber = 1; routes.length; stepNumber++) {
        if (this.isStopping)
          return 0;
        
        // Create new routes (find steps that make a 0 or required elevation change and do not lead to visited points)
        let newRoutes = [];
        for (let route of routes) {
          let x = route[route.length - 1].x;
          let y = route[route.length - 1].y;
          let elevation = map[y][x];
          let possibleSteps = [];

          if (x > 0)
            possibleSteps.push(new Vector2D(x - 1, y));
          if (x < mapWidth - 1)
            possibleSteps.push(new Vector2D(x + 1, y));
          if (y > 0)
            possibleSteps.push(new Vector2D(x, y - 1));
          if (y < mapHeight - 1)
            possibleSteps.push(new Vector2D(x, y + 1));

          for (let step of possibleSteps) {
            let newElevation = map[step.y][step.x];
            if (((part == 1 && newElevation - elevation <= 1) || (part == 2 && newElevation - elevation >= -1)) && !visitedPoints[step.y][step.x]) {
              let newRoute = route.slice();
              newRoute.push(step);
              visitedPoints[step.y][step.x] = true;
              newRoutes.push(newRoute);
            }
          }

          if (visualization) {
            for (let point of route)
              pixelMap.drawPixel(point.x, point.y, map[point.y][point.x]);
          }
        }

        routes = newRoutes;
        let routeFound = false;
        for (let route of routes) {
          if (map[route[route.length - 1].y][route[route.length - 1].x] == destinationElevation) {
            newRoutes = [route];
            routeFound = true;
          }
        }
        routes = newRoutes;

        solConsoleLine.innerHTML = `Step ${stepNumber}: number of routes = ${routes.length}.`;

        // Add new routes to the image
        if (visualization) {
          for (let route of routes) {
            for (let point of route) {
              if (point.x != end.x || point.y != end.y)
                pixelMap.drawPixel(point.x, point.y, highlightColorIndex);
            }
          }

          await delay(10);
        }

        if (routeFound)
          return stepNumber;
      }

      throw new Error(`Route not found`);
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