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
   * @returns {string[][]} Map.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let map = input.trim().split(/\r?\n/).map((line, index, lines) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);
      if (!/^[\.#\^><v]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return line.split("");
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds the longest route from start point to end point.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of steps in the longest route from start point to end point.
   */
  async solve(part, input, visualization) {
    const forestColorIndex = 1;
    const forestColor = "#00aa00";
    const slopeColorIndex = 2;
    const slopeColor = "#aaaaaa";
    const highlightColorIndex = 3;
    const highlightColor = "#ffffff";

    try {
      this.isSolving = true;

      let map = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;
      let start, end;
      for (let x = 0; x < mapWidth; x++) {
        if (map[0][x] == ".")
          start = new Vector2D(x, 0);
        if (map[mapHeight - 1][x] == ".")
          end = new Vector2D(x, mapHeight - 1);
      }

      let intersections = new Map();
      let startIntersection = new Intersection(start.x, start.y);
      intersections.set(start.y * mapWidth + start.x, startIntersection);
      let endIntersection = new Intersection(end.x, end.y);
      intersections.set(end.y * mapWidth + end.x, endIntersection);

      // Find all intersections
      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          if (map[y][x] == ".") {
            let numberOfPossibleSteps = 0;
            if (x > 0 && map[y][x - 1] != "#")
              numberOfPossibleSteps++;
            if (x < mapWidth - 1 && map[y][x + 1] != "#")
              numberOfPossibleSteps++;
            if (y > 0 && map[y - 1][x] != "#")
              numberOfPossibleSteps++;
            if (y < mapHeight - 1 && map[y + 1][x] != "#")
              numberOfPossibleSteps++;
            if (numberOfPossibleSteps > 2)
              intersections.set(y * mapWidth + x, new Intersection(x, y));
          }
        }
      }

      // Find routes between intersections
      for (let [key, intersection] of intersections.entries()) {
        let x = intersection.x;
        let y = intersection.y;
        let routeStartPoints = [];
        if (x > 0 && map[y][x - 1] != "#" && (part == 2 || map[y][x] == "." || map[y][x] == "<"))
          routeStartPoints.push(new Vector2D(x - 1, y));
        if (x < mapWidth - 1 && map[y][x + 1] != "#" && (part == 2 || map[y][x] == "." || map[y][x] == ">"))
          routeStartPoints.push(new Vector2D(x + 1, y));
        if (y > 0 && map[y - 1][x] != "#" && (part == 2 || map[y][x] == "." || map[y][x] == "^"))
          routeStartPoints.push(new Vector2D(x, y - 1));
        if (y < mapHeight - 1 && map[y + 1][x] != "#" && (part == 2 || map[y][x] == "." || map[y][x] == "v"))
          routeStartPoints.push(new Vector2D(x, y + 1));

        for (let step of routeStartPoints) {
          let steps = [];
          steps.push(step);
          let previousStep = new Vector2D(intersection.x, intersection.y);
          let destination = undefined;

          while (step != undefined && destination == undefined) {
            destination = intersections.get(step.y * mapWidth + step.x);
            if (destination == undefined) {
              let possibleSteps = [];
              let x = step.x;
              let y = step.y;
              if (x > 0 && map[y][x - 1] != "#" && (part == 2 || map[y][x] == "." || map[y][x] == "<"))
                possibleSteps.push(new Vector2D(x - 1, y));
              if (x < mapWidth - 1 && map[y][x + 1] != "#" && (part == 2 || map[y][x] == "." || map[y][x] == ">"))
                possibleSteps.push(new Vector2D(x + 1, y));
              if (y > 0 && map[y - 1][x] != "#" && (part == 2 || map[y][x] == "." || map[y][x] == "^"))
                possibleSteps.push(new Vector2D(x, y - 1));
              if (y < mapHeight - 1 && map[y + 1][x] != "#" && (part == 2 || map[y][x] == "." || map[y][x] == "v"))
                possibleSteps.push(new Vector2D(x, y + 1));
              
              let newStep = possibleSteps.find(s => s.x != previousStep.x || s.y != previousStep.y);
              previousStep = step;
              step = newStep;
              steps.push(step);
            }
          }
          if (destination != undefined)
            intersection.destinationMap.set(destination, steps);
        }
      }

      // Find the longest route
      startIntersection.findLongestRoutes([startIntersection], 0, endIntersection);

      if (visualization) {
        let pixelMap = new PixelMap(mapWidth, mapHeight);

        this.visContainer.append(pixelMap.container);
        pixelMap.palette[forestColorIndex] = forestColor;
        pixelMap.palette[slopeColorIndex] = slopeColor;
        pixelMap.palette[highlightColorIndex] = highlightColor;

        pixelMap.draw(map.map(line => line.map(e => e == "#" ? forestColorIndex : (e == "." ? 0 : slopeColorIndex))));

        pixelMap.drawPixel(start.x, start.y, highlightColorIndex);
        for (let i = 1; i < endIntersection.longestRoute.length; i++) {
          for (let point of endIntersection.longestRoute[i - 1].destinationMap.get(endIntersection.longestRoute[i])) {
            if (this.isStopping)
              return 0;
            pixelMap.drawPixel(point.x, point.y, highlightColorIndex);
            await delay (1);
          }
        }
      }
      return endIntersection.longestRouteDistance;
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
 * Puzzle map intersection class
 */
class Intersection {
  /**
   * @param {number} x X coordinate.
   * @param {number} y Y coordinate.
   */
  constructor(x, y) {
    /**
     * X coordinate.
     * @type {number}
     */
    this.x = x;
    /**
     * Y coordinate.
     * @type {number}
     */
    this.y = y;
    /**
     * Destination map (key - intersection, value - step coordinates).
     * @type {Map<Intersection, Vector2D[]>}
     */
    this.destinationMap = new Map();
    /**
     * Intersection has been visited while finding the longest route.
     * @type {boolean}
     */    
    this.isVisited = false;
    /**
     * Longest distance to this intersection.
     * @type {number}
     */
    this.longestRouteDistance = 0;
    /**
     * Longest route to this intersection.
     * @type {Intersection[]}
     */
    this.longestRoute = [];
  }

  /**
   * Finds longest routes to other intersections.
   * @param {Intersection[]} currentRoute Current route intersections.
   * @param {number} currentDistance Current route distance.
   * @param {Intersection} endIntersection End intersection.
   */
  findLongestRoutes(currentRoute, currentRouteDistance, endIntersection) {
    if (this.isVisited)
      return;
    this.isVisited = true;

    if (this.longestRouteDistance < currentRouteDistance) {
      this.longestRoute = currentRoute.slice();
      this.longestRouteDistance = currentRouteDistance;
    }

    if (this != endIntersection) {
      for (let [destination, steps] of this.destinationMap) {
        currentRoute.push(destination);
        destination.findLongestRoutes(currentRoute, currentRouteDistance + steps.length, endIntersection);
        currentRoute.pop();
      }
    }

    this.isVisited = false;
  }
}