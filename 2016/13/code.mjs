import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

const wallColorIndex = 1;
const wallColor = "#999999";
const pathColorIndex = 2;
const pathColor = "#ffffff";
const startColorIndex = 3;
const startColor = "#00aa00";
const endColorIndex = 4;
const endColor = "#ffff00";

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
   * @returns {number} Favorite number.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let line = input.trim();
    if (isNaN(line))
      throw new Error("Invalid input data")

    consoleLine.innerHTML += " done.";
    return parseInt(line);
  }

  /**
   * Finds the fewest number of steps required to reach the specified location (part 1) or the number of locations reachable in at most 50 steps (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Fewest number of steps required to reach the specified location (part 1) or the number of locations reachable in at most 50 steps (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let favoriteNumber = this.parse(input);

      let startPosition = new Vector2D(1, 1);
      let part1EndPosition = favoriteNumber == 10 ? new Vector2D(7, 4) : new Vector2D(31, 39);
      let part2NumberOfSteps = 50;

      let positionMap = new Map();
      positionMap.set(`${startPosition.x}|${startPosition.y}`, 0);
      let directions = [new Vector2D(0, -1), new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(-1, 0)];

      let routes = [[startPosition]]
      let part1ResultRoute = null;
      let part2AllRoutes = [];
      for (let step = 0; routes.length > 0 && ((part == 1 && part1ResultRoute == null) || (part == 2 && step < part2NumberOfSteps)); step++) {
        let newRoutes = [];
        for (let route of routes) {
          let routeContinues = false;
          for (let nextPosition of directions.map(e => route[route.length - 1].clone().add(e))) {
            if (nextPosition.x >= 0 && nextPosition.y >= 0) {
              let nextPositionString = `${nextPosition.x}|${nextPosition.y}`;
              let wall = positionMap.get(nextPositionString);
              if (wall == undefined) {
                let x = nextPosition.x, y = nextPosition.y;
                wall = (x * x + 3 * x + 2 * x * y + y + y * y + favoriteNumber).toString(2).split("").reduce((acc, e) => acc + (e != "0" ? 1 : 0), 0) % 2 == 1;
                positionMap.set(nextPositionString, wall);
                if (!wall) {
                  newRoutes.push(route.slice());
                  newRoutes[newRoutes.length - 1].push(nextPosition);
                  routeContinues = true;
                  if (nextPosition.equals(part1EndPosition))
                    part1ResultRoute = newRoutes[newRoutes.length - 1];
                }
              }
            }
          }
          if (!routeContinues)
            part2AllRoutes.push(route);
        }
        routes = newRoutes;
      }

      if (part == 1 && part1ResultRoute == null)
        throw new Error("Route not found")

      part2AllRoutes.push(...routes);
      
      if (visualization) {
        let maxMapCoordinates = positionMap.keys()
          .reduce((acc, e) => new Vector2D(Math.max(acc.x, parseInt(e.split("|")[0])), Math.max(acc.y, parseInt(e.split("|")[1]))), new Vector2D(0, 0));

        let pixelMap = new PixelMap(maxMapCoordinates.x + 1, maxMapCoordinates.y + 1);
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[wallColorIndex] = wallColor;
        pixelMap.palette[pathColorIndex] = pathColor;
        pixelMap.palette[startColorIndex] = startColor;
        pixelMap.palette[endColorIndex] = endColor;

        for (let x = 0; x < pixelMap.width; x++) {
          for (let y = 0; y < pixelMap.height; y++) {
            if ((x * x + 3 * x + 2 * x * y + y + y * y + favoriteNumber).toString(2).split("").reduce((acc, e) => acc + (e != "0" ? 1 : 0), 0) % 2 == 1)
              pixelMap.drawPixel(x, y, wallColorIndex);
          }
        }

        pixelMap.drawPixel(startPosition.x, startPosition.y, startColorIndex);
        if (part == 1) {
          let solConsole = this.solConsole;
          solConsole.addLine(`Number of steps: ${part1ResultRoute.length - 1}.`);
          let solConsoleLine = solConsole.addLine();

          pixelMap.drawPixel(part1EndPosition.x, part1EndPosition.y, endColorIndex);
          for (let i = 1; i < part1ResultRoute.length; i++) {
            if (this.isStopping)
              return;
            if (i < part1ResultRoute.length - 1)
              pixelMap.drawPixel(part1ResultRoute[i].x, part1ResultRoute[i].y, pathColorIndex);
            solConsoleLine.innerHTML = `Step: ${i}.`;
            await delay(10);
          }
        }
        else {
          let solConsole = this.solConsole;
          solConsole.addLine(`Number of steps: ${part2NumberOfSteps}.`);
          let solConsoleLine = solConsole.addLine();

          for (let i = 1; i <= part2NumberOfSteps; i++) {
            if (this.isStopping)
              return;
            for (let route of part2AllRoutes) {
              if (route.length > i)
                pixelMap.drawPixel(route[i].x, route[i].y, pathColorIndex);
            }
            solConsoleLine.innerHTML = `Step: ${i}.`;
            await delay(10);
          }  
        }
      }

      return part == 1 ? part1ResultRoute.length - 1 : positionMap.values().reduce((acc, e) => acc + (e == 0 ? 1 : 0), 0);
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