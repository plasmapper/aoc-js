import { delay, Console, PixelMap, Vector2D, Range } from "../../utility.mjs";

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
   * @returns {number[][]} Map.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let map = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      if (!/^[.#S]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      
      if (index != 0 && line.length != map[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);

      map.push(line.split("").map(e => e == "." ? 0 : (e == "#" ? 1 : 2)));
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds the number of plots that can be reached in specified number of steps.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of plots that can be reached in specified number of steps.
   */
  async solve(part, input, visualization) {
    const rockColorIndex = 1;
    const rockColor = "#00aa00";
    const startColorIndex = 2;
    const startColor = "#ffff00";
    const highlightColorIndex = 3;
    const highlightColor = "#ffffff";

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

      if (start == undefined)
        throw new Error("Start position not found");

      if (part == 1) {
        let numberOfSteps = mapWidth < 15 ? 6 : 64;

        let stepMap = [];
        for (let y = 0; y < mapHeight; y++) {
          stepMap.push([]);
          for (let x = 0; x < mapWidth; x++)
            stepMap[stepMap.length - 1].push(new Set());
        }        

        let solConsole = this.solConsole;
        solConsole.addLine(`Number of steps: ${numberOfSteps}.`);
        let solConsoleLine = solConsole.addLine();
  
        let pixelMap = new PixelMap(mapWidth, mapHeight);
        
        if (visualization) {
          this.visContainer.append(pixelMap.container);
          pixelMap.palette[rockColorIndex] = rockColor;
          pixelMap.palette[startColorIndex] = startColor;
          pixelMap.palette[highlightColorIndex] = highlightColor;
  
          pixelMap.draw(map)
        }

        stepMap[start.y][start.x].add(0);
        for (let step = 1; step <= numberOfSteps; step++) {
          if (this.isStopping)
            return;
  
          for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
              if (stepMap[y][x].has(step - 1)) {
                if (x > 0 && map[y][x - 1] != 1)
                  stepMap[y][x - 1].add(step);
                if (x < mapWidth - 1 && map[y][x + 1] != 1)
                  stepMap[y][x + 1].add(step);
                if (y > 0 && map[y - 1][x] != 1)
                  stepMap[y - 1][x].add(step);
                if (y < mapHeight - 1 && map[y + 1][x] != 1)
                  stepMap[y + 1][x].add(step);
              }
            }
          }
          
          solConsoleLine.innerHTML = `Step: ${step}.`;
          if (visualization) {
            await delay(10);
  
            for (let y = 0; y < mapHeight; y++) {
              for (let x = 0; x < mapWidth; x++) {
                if (pixelMap.image[y][x] != startColorIndex) {
                  if (stepMap[y][x].has(step - 1))
                    pixelMap.drawPixel(x, y, 0);
                  if (stepMap[y][x].has(step))
                    pixelMap.drawPixel(x, y, highlightColorIndex);
                }
              }
            }
          }
        }
  
        let numberOfPlots = 0;
        for (let y = 0; y < mapHeight; y++) {
          for (let x = 0; x < mapWidth; x++) {
            if (stepMap[y][x].has(numberOfSteps))
              numberOfPlots++;
          }
        }
  
        return numberOfPlots;
      }
      else {
        let numberOfSteps = mapWidth < 15 ? 5000 : 26501365;
        
        // Calculate number of plots for fully covered center and side map
        let numberOfPlotsForCenterMap = this.findNumberOfPlots(start, map, numberOfSteps % 2 + mapWidth + mapWidth % 2);
        let numberOfPlotsForSideMap = this.findNumberOfPlots(start, map, numberOfSteps % 2 + mapWidth + mapWidth + mapWidth % 2);

        // Number of fully covered maps to any side of the center map
        let numberOfFullMapsToOneSide = Math.floor(numberOfSteps / mapWidth) - 1;
        // Number of maps that will be covered in the same manner as the center map
        let numberOfMapsLikeCenterMap = Math.floor(numberOfFullMapsToOneSide / 2) * 2 + 1;
        // Number of maps that will be covered in the same manner as the side map
        let numberOfMapsLikeSideMap = Math.ceil(numberOfFullMapsToOneSide / 2) * 2;

        numberOfMapsLikeCenterMap = numberOfMapsLikeCenterMap + (numberOfMapsLikeCenterMap - 1 + 1) * (numberOfMapsLikeCenterMap - 1) / 2 * 2;
        numberOfMapsLikeSideMap = numberOfMapsLikeSideMap + (numberOfMapsLikeSideMap - 1 + 1) * (numberOfMapsLikeSideMap - 1) / 2 * 2;
        
        // Calculate rhombus body plots
        let numberOfPlots = numberOfMapsLikeCenterMap * numberOfPlotsForCenterMap + numberOfMapsLikeSideMap * numberOfPlotsForSideMap;

        // Add rhombus corner plots
        let numberOfStepsToBorder = mapWidth - start.x;
        let numberOfCornerSteps = numberOfSteps - numberOfStepsToBorder - numberOfFullMapsToOneSide * mapWidth;
        numberOfPlots += this.findNumberOfPlots(new Vector2D(start.x, 0), map, numberOfCornerSteps);
        numberOfPlots += this.findNumberOfPlots(new Vector2D(start.x, 0), map, numberOfCornerSteps - mapWidth);
        numberOfPlots += this.findNumberOfPlots(new Vector2D(start.x, mapHeight - 1), map, numberOfCornerSteps);
        numberOfPlots += this.findNumberOfPlots(new Vector2D(start.x, mapHeight - 1), map, numberOfCornerSteps - mapWidth);
        numberOfPlots += this.findNumberOfPlots(new Vector2D(0, start.y), map, numberOfCornerSteps);
        numberOfPlots += this.findNumberOfPlots(new Vector2D(0, start.y), map, numberOfCornerSteps - mapWidth);
        numberOfPlots += this.findNumberOfPlots(new Vector2D(mapWidth - 1, start.y), map, numberOfCornerSteps);
        numberOfPlots += this.findNumberOfPlots(new Vector2D(mapWidth - 1, start.y), map, numberOfCornerSteps - mapWidth);

        // Add rhombus side plots
        let numberOfSideSteps1 = numberOfSteps - mapWidth * (numberOfFullMapsToOneSide + 1) - 1;
        let numberOfSideSteps2 = numberOfSteps - mapWidth * numberOfFullMapsToOneSide - 1;

        numberOfPlots += this.findNumberOfPlots(new Vector2D(0, 0), map, numberOfSideSteps1) * (numberOfFullMapsToOneSide + 1);
        numberOfPlots += this.findNumberOfPlots(new Vector2D(0, 0), map, numberOfSideSteps2) * numberOfFullMapsToOneSide;
        numberOfPlots += this.findNumberOfPlots(new Vector2D(0, mapHeight - 1), map, numberOfSideSteps1) * (numberOfFullMapsToOneSide + 1);
        numberOfPlots += this.findNumberOfPlots(new Vector2D(0, mapHeight - 1), map, numberOfSideSteps2) * numberOfFullMapsToOneSide;
        numberOfPlots += this.findNumberOfPlots(new Vector2D(mapWidth - 1, 0), map, numberOfSideSteps1) * (numberOfFullMapsToOneSide + 1);
        numberOfPlots += this.findNumberOfPlots(new Vector2D(mapWidth - 1, 0), map, numberOfSideSteps2) * numberOfFullMapsToOneSide;
        numberOfPlots += this.findNumberOfPlots(new Vector2D(mapWidth - 1, mapHeight - 1), map, numberOfSideSteps1) * (numberOfFullMapsToOneSide + 1);
        numberOfPlots += this.findNumberOfPlots(new Vector2D(mapWidth - 1, mapHeight - 1), map, numberOfSideSteps2) * numberOfFullMapsToOneSide;

        if (visualization)
          this.solConsole.addLine("Solution is based on the assumption that, starting from the center, corners are reached after (map size - 1) steps. This does not work for test input.")

        return numberOfPlots;
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

  findNumberOfPlots(start, map, numberOfSteps) {
    if (numberOfSteps < 0)
      return 0;

    let mapWidth = map[0].length;
    let mapHeight = map.length;

    let stepMap = [];
    for (let y = 0; y < mapHeight; y++) {
      stepMap.push([]);
      for (let x = 0; x < mapWidth; x++)
        stepMap[stepMap.length - 1].push(new Set());
    }   

    stepMap[start.y][start.x].add(0);
    for (let step = 1; step <= numberOfSteps; step++) {
      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          if (stepMap[y][x].has(step - 1)) {
            if (x > 0 && map[y][x - 1] != 1)
              stepMap[y][x - 1].add(step);
            if (x < mapWidth - 1 && map[y][x + 1] != 1)
              stepMap[y][x + 1].add(step);
            if (y > 0 && map[y - 1][x] != 1)
              stepMap[y - 1][x].add(step);
            if (y < mapHeight - 1 && map[y + 1][x] != 1)
              stepMap[y + 1][x].add(step);
          }
        }
      }
    }

    let numberOfPlots = 0;
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        if (stepMap[y][x].has(numberOfSteps))
          numberOfPlots++;
      }
    }

    return numberOfPlots;
  }
}
