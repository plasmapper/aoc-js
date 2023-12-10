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
   * @returns {Vector[][]} Map structures.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let structures = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      let structure = [];
      line.split("->").forEach(point => {
        let coordinates = point.split(",").map(e => e.trim());
        if (coordinates.length != 2 || isNaN(parseInt(coordinates[0])|| isNaN(parseInt(coordinates[1]))))
          throw new Error(`Invalid length of line ${index + 1}`);
        structure.push(new Vector2D(parseInt(coordinates[0]), parseInt(coordinates[1])));
      });
      structures.push(structure);
    });

    consoleLine.innerHTML += " done.";
    return structures;
  }

  /**
   * Finds the number of sand units that come to rest before overflowing (part 1) or before the sand source becomes blocked.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The number of sand units that come to rest before overflowing (part 1) or before the sand source becomes blocked.
   */
  async solve(part, input, visualization) {
    const structureColorIndex = 1;
    const structureColor = "#999999";
    const sandColorIndex = 2;
    const sandColor = "#ffff00";

    try {
      this.isSolving = true;

      let structures = this.parse(input);
      let mapMinX = structures[0][0].x;
      let mapMaxX = structures[0][0].x;
      let mapMaxY = structures[0][0].y;

      structures.forEach(structure => structure.forEach(point => {
        mapMinX = Math.min(mapMinX, point.x);
        mapMaxX = Math.max(mapMaxX, point.x);
        mapMaxY = Math.max(mapMaxY, point.y);
      }));

      let startPoint = new Vector2D(500, 0);

      // For part 1 expand the map one column left and wright
      if (part == 1) {
        mapMinX--;
        mapMaxX++;
      }
      // For part two expand the map two rows to the bottom and also left and right so that the sand can form a pile up to the source
      else {
        mapMaxY += 2;
        mapMinX = Math.min(mapMinX, startPoint.x - (mapMaxY - 1));
        mapMaxX = Math.max(mapMaxX, startPoint.x + (mapMaxY - 1));
      }

      // Shift the map to start from X = 0
      structures.forEach(structure => structure.forEach(point => point.x -= mapMinX));
      startPoint.x -= mapMinX;
      mapMaxX -= mapMinX;
      mapMinX = 0;

      let solConsole = this.solConsole;
      let pixelMap = new PixelMap(mapMaxX + 1, mapMaxY + 1);
      solConsole.addLine(`Map width: ${mapMaxX + 1}. Map height: ${mapMaxY + 1}.`);    
      let solConsoleLine = solConsole.addLine();

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[structureColorIndex] = structureColor;
        pixelMap.palette[sandColorIndex] = sandColor;
      }

      // Draw the map
      for (let structure of structures) {
        for (let i = 0; i < structure.length - 1; i++) {
          let step = new Vector2D(Math.sign(structure[i + 1].x - structure[i].x), Math.sign(structure[i + 1].y - structure[i].y));
          for (let point = structure[i].clone(); point.x != structure[i + 1].x || point.y != structure[i + 1].y; point.add(step))
            pixelMap.drawPixel(point.x, point.y, structureColorIndex);
        }
        pixelMap.drawPixel(structure[structure.length - 1].x, structure[structure.length - 1].y, structureColorIndex);
      }

      if (part == 2) {
        for (let x = 0; x <= mapMaxX; x++)
          pixelMap.drawPixel(x, mapMaxY, structureColorIndex);
      }

      let unitsOfSand = []
      let numberOfUnitsOfSandAtRest = 0;
      
      for (let i = 0; ; i++) {
        if (this.isStopping)
          return 0;

        // Create new sand unit
        if (i % 2 == 0)
          unitsOfSand.push(startPoint.clone());

        let newUnitsOfSand = [];
        // Move sand units
        for (let unit of unitsOfSand) {
          pixelMap.drawPixel(unit.x, unit.y, 0);
          if (pixelMap.image[unit.y + 1][unit.x] == 0) {
            unit.y++;
            newUnitsOfSand.push(unit);
          }
          else if (pixelMap.image[unit.y + 1][unit.x - 1] == 0) {
            unit.x--;
            unit.y++;
            newUnitsOfSand.push(unit);
          }
          else if (pixelMap.image[unit.y + 1][unit.x + 1] == 0) {
            unit.x++;
            unit.y++;
            newUnitsOfSand.push(unit);
          }
          else {
            pixelMap.drawPixel(unit.x, unit.y, sandColorIndex);
            numberOfUnitsOfSandAtRest++;
          }
          pixelMap.drawPixel(unit.x, unit.y, sandColorIndex);
        }

        unitsOfSand = newUnitsOfSand;

        solConsoleLine.innerHTML = `Units of sand at rest: ${numberOfUnitsOfSandAtRest}.`;        
        if (visualization)
          await delay(part == 1 || mapMaxX * mapMaxY < 2000 ? 1 : (i % 25 == 0 ? 1 : 0));

        // Check end conditions
        if ((part == 1 && unitsOfSand[0].y == mapMaxY) || (part == 2 && i % 2 == 0 && unitsOfSand.length == 0))
          return numberOfUnitsOfSandAtRest
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