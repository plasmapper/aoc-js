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
   * @returns {number[][]} Map (0 - ground, 1 - pipe, 2 - start).
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let mapWidth = 0;
    let map = [];
    input.trim().split(/\r?\n/).forEach((line, y) => {
      if (mapWidth == 0)
        mapWidth = line.length * 3;
      if (line.length * 3 != mapWidth)
        throw new Error(`Invalid length of line ${y + 1}`);
      if (!/^[\|\-LJ7F\.S]+$/.test(line))
        throw new Error(`Invalid data in line ${y + 1}`);

      map.push(new Array(mapWidth).fill(0), new Array(mapWidth).fill(0), new Array(mapWidth).fill(0));
      for (let [x, pipe] of line.split("").entries()) {
        switch (pipe) {
          case "|":
            map[y * 3][x * 3 + 1] = map[y * 3 + 1][x * 3 + 1] = map[y * 3 + 2][x * 3 + 1] = 1;
            break;
          case "-":
            map[y * 3 + 1][x * 3] = map[y * 3 + 1][x * 3 + 1] = map[y * 3 + 1][x * 3 + 2] = 1;
            break;
          case "L":
            map[y * 3][x * 3 + 1] = map[y * 3 + 1][x * 3 + 1] = map[y * 3 + 1][x * 3 + 2] = 1;
            break;
          case "J":
            map[y * 3][x * 3 + 1] = map[y * 3 + 1][x * 3 + 1] = map[y * 3 + 1][x * 3] = 1;
            break;
          case "7":
            map[y * 3 + 1][x * 3] = map[y * 3 + 1][x * 3 + 1] = map[y * 3 + 2][x * 3 + 1] = 1;
            break;
          case "F":
            map[y * 3 + 1][x * 3 + 2] = map[y * 3 + 1][x * 3 + 1] = map[y * 3 + 2][x * 3 + 1] = 1;
            break;
          case "S":
            map[y * 3][x * 3 + 1] = map[y * 3 + 2][x * 3 + 1] = map[y * 3 + 1][x * 3] = map[y * 3 + 1][x * 3 + 2] = 1;
            map[y * 3 + 1][x * 3 + 1] = 2;
            break;
        }
      }
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
    const pipeColorIndex = 1;
    const pipeColor = "#aaaaaa";
    const startColorIndex = 2;
    const startColor = "#ffff00";
    const highlightColorIndex = 3;
    const highlightColor = "#ffffff";
    const insideColorIndex = 4;
    const insideColor = "#00aa00";
    const outsideColorIndex = 5;
    const outsideColor = "#888888";

    try {
      this.isSolving = true;

      let map = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;
      let start;
      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          if (map[y][x] == 2)
            start = new Vector2D(x, y);
        }
      }

      let pixelMap = new PixelMap(mapWidth, mapHeight);

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[pipeColorIndex] = pipeColor;
        pixelMap.palette[startColorIndex] = startColor;
        pixelMap.palette[highlightColorIndex] = highlightColor;
        pixelMap.palette[insideColorIndex] = insideColor;
        pixelMap.palette[outsideColorIndex] = outsideColor;
      }
      pixelMap.draw(map);

      // Select the initial step
      let route;
      if (start.x > 1 && map[start.y][start.x - 2] != 0)
        route = [start.clone().add(new Vector2D(-1, 0)), start.clone().add(new Vector2D(-2, 0))];
      else if (start.x < mapWidth - 2 && map[start.y][start.x + 2] != 0)
        route = [start.clone().add(new Vector2D(1, 0)), start.clone().add(new Vector2D(2, 0))];
      else if (start.y > 1 && map[start.y - 2][start.x] != 0)
        route = [start.clone().add(new Vector2D(0, -1)), start.clone().add(new Vector2D(0, -2))];
      else if (start.y < mapHeight - 2 && map[start.y + 2][start.x] != 0)
        route = [start.clone().add(new Vector2D(0, 1)), start.clone().add(new Vector2D(0, 2))];
      else
        throw new Error("Start point is not connected to other pipes")

      // Find the loop
      let loopFound = false;
      let stepNumber = 0;
      for (; !loopFound; stepNumber++) {
        if (this.isStopping)
          return 0;
        
        let previousX = route[route.length - 2].x;
        let previousY = route[route.length - 2].y;
        let x = route[route.length - 1].x;
        let y = route[route.length - 1].y;

        let possibleSteps = [new Vector2D(x - 1, y), new Vector2D(x + 1, y), new Vector2D(x, y - 1), new Vector2D(x, y + 1)];
        let newStep = null;

        for (let step of possibleSteps) {
          if (newStep == null && step.x > 0 && step.x < mapWidth - 1 && step.y > 0 && step.y < mapHeight - 1 && map[step.y][step.x] != 0 && (step.x != previousX || step.y != previousY))
            newStep = step;
        }

        if (newStep == null)
          throw new Error(`Route not found`);

        if (newStep.equals(start))
          loopFound = true;
        else
          route.push(newStep);
      }

      // Draw the route
      for (let point of route)
        pixelMap.drawPixel(point.x, point.y, highlightColorIndex);

      if (part == 1)
        return Math.floor((stepNumber + 2) / 3 / 2);

      if (visualization)
        await delay(500);

      // Find the outside points
      let image = pixelMap.image.map(line => line.map(pixel => pixel == startColorIndex || pixel == highlightColorIndex ? pixel : 0));
      pixelMap.draw(image);
      pixelMap.fill(0, 0, outsideColorIndex);
      
      if (visualization)
        await delay(500);

      // Find the inside points
      let numberOfInsidePoints = 0;
      image = pixelMap.image;
      for (let y = 0; y < mapHeight; y += 3) {
        for (let x = 0; x < mapWidth; x += 3) {
          if (image[y][x] == 0 && image[y][x + 1] == 0 && image[y][x + 2] == 0 &&
            image[y + 1][x] == 0 && image[y + 1][x + 1] == 0 && image[y + 1][x + 2] == 0 &&
            image[y + 2][x] == 0 && image[y + 2][x + 1] == 0 && image[y + 2][x + 2] == 0) {
            
            numberOfInsidePoints++;
            for (let dx = 0; dx < 3; dx++) {
              for (let dy = 0; dy < 3; dy++)
                pixelMap.drawPixel(x + dx, y + dy, insideColorIndex);
            }
          }            
        }
      }

      return numberOfInsidePoints;
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