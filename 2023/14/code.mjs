import { delay, Console, PixelMap } from "../../utility.mjs";

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
      if (!/^[.O#]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      
      if (index != 0 && line.length != map[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);

      map.push(line.split("").map(e => e == "." ? 0 : (e == "#" ? 1 : 2)));
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds total load on the north support beams after platform tilt cycles.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Total load on the north support beams after platform tilt cycles.
   */
  async solve(part, input, visualization) {
    const cubeShapedRockColorIndex = 1;
    const cubeShapedRockColor = "#00aa00";
    const roundedRockColorIndex = 2;
    const roundedRockColor = "#ffffff";
    const visualizationDelay = 50;

    try {
      this.isSolving = true;

      let map = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;

      let solConsole = this.solConsole;
      solConsole.addLine(`Map width: ${mapWidth}. Map height: ${mapHeight}.`);
      let solConsoleLine = solConsole.addLine();

      let pixelMap = new PixelMap(mapWidth, mapHeight);
      
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[cubeShapedRockColorIndex] = cubeShapedRockColor;
        pixelMap.palette[roundedRockColorIndex] = roundedRockColor;
      }

      // Roll the stones once to the north
      if (part == 1) {
        for (let x = 0; x < mapWidth; x++) {
          let nextMovedY = 0;
          for (let y = 0; y < mapHeight; y++) {
            if (map[y][x] == 1)
              nextMovedY = y + 1;
            if (map[y][x] == 2) {
              map[y][x] = 0;
              map[nextMovedY++][x] = 2;
            }            
          }
        }

        if (visualization)
          pixelMap.draw(map);
      }

      // Perform multiple tilt cycles
      else {
        let mapToCycleNumberMap = new Map();

        let mapCycleFound = false;
        let numberOfCycles = 1000000000;
        
        for (let i = 1; i <= numberOfCycles; i++) {
          if (this.isStopping)
            return;

          solConsoleLine.innerHTML = `Cycle: ${i}.`;

          // Roll the stones to the north
          for (let x = 0; x < mapWidth; x++) {
            let nextMovedY = 0;
            for (let y = 0; y < mapHeight; y++) {
              if (map[y][x] == 1)
                nextMovedY = y + 1;
              if (map[y][x] == 2) {
                map[y][x] = 0;
                map[nextMovedY++][x] = 2;
              }            
            }
          }

          if (visualization) {
            pixelMap.draw(map);
            await delay(visualizationDelay);
          }

          // Roll the stones to the west
          for (let y = 0; y < mapHeight; y++) {
            let nextMovedX = 0;
            for (let x = 0; x < mapWidth; x++) {
              if (map[y][x] == 1)
                nextMovedX = x + 1;
              if (map[y][x] == 2) {
                map[y][x] = 0;
                map[y][nextMovedX++] = 2;
              }            
            }
          }

          if (visualization) {
            pixelMap.draw(map);
            await delay(visualizationDelay);
          }

          // Roll the stones to the south
          for (let x = 0; x < mapWidth; x++) {
            let nextMovedY = mapHeight - 1;
            for (let y = mapHeight - 1; y >= 0; y--) {
              if (map[y][x] == 1)
                nextMovedY = y - 1;
              if (map[y][x] == 2) {
                map[y][x] = 0;
                map[nextMovedY--][x] = 2;
              }            
            }
          }

          if (visualization) {
            pixelMap.draw(map);
            await delay(visualizationDelay);
          }

          // Roll the stones to the east
          for (let y = 0; y < mapHeight; y++) {
            let nextMovedX = mapWidth - 1;
            for (let x = mapWidth - 1; x >= 0; x--) {
              if (map[y][x] == 1)
                nextMovedX = x - 1;
              if (map[y][x] == 2) {
                map[y][x] = 0;
                map[y][nextMovedX--] = 2;
              }            
            }
          }

          if (visualization) {
            pixelMap.draw(map);
            await delay(visualizationDelay);
          }

          // Check if the map was the same after some cycle before
          if (!mapCycleFound) {
            let mapAsString = map.reduce((acc, line) => acc + line.join(""), "");
            let previousCycleWithSameMap = mapToCycleNumberMap.get(mapAsString);
            if (previousCycleWithSameMap != undefined) {
              mapCycleFound = true;
              solConsole.addLine(`Map after cycle ${i} is the same as after cycle ${previousCycleWithSameMap}.`);
              i = previousCycleWithSameMap + Math.floor((numberOfCycles - previousCycleWithSameMap) / (i - previousCycleWithSameMap)) * (i - previousCycleWithSameMap);
              solConsole.addLine(`It will also be the same after cycle ${i}.`);
              solConsoleLine = solConsole.addLine();
            }

            mapToCycleNumberMap.set(mapAsString, i);
          }
        }
      }


      return map.reduce((accY, line, y) => accY + line.reduce((accX, e) => accX + (e == 2 ? mapHeight - y : 0), 0), 0);
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