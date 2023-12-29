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
   * @returns {string[]} Jets.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    input = input.trim();
    if (!/^[<>]+$/.test(input))
      throw new Error(`Invalid data`);

    return input.split("");
  }

  /**
   * Finds the tower height.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Tower height.
   */
  async solve(part, input, visualization) {
    const towerColorIndex = 1;
    const towerColor = "#00aa00";
    const rockColorIndex = 2;
    const rockColor = "#ffffff";

    try {
      this.isSolving = true;

      let jets = this.parse(input);
      let rocks = [
        new Rock([new Vector2D(0, 0), new Vector2D(1, 0), new Vector2D(2, 0), new Vector2D(3, 0)]),
        new Rock([new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(1, 1), new Vector2D(2, 1), new Vector2D(1, 2)]),
        new Rock([new Vector2D(0, 0), new Vector2D(1, 0), new Vector2D(2, 0), new Vector2D(2, 1), new Vector2D(2, 2)]),
        new Rock([new Vector2D(0, 0), new Vector2D(0, 1), new Vector2D(0, 2), new Vector2D(0, 3)]),
        new Rock([new Vector2D(0, 0), new Vector2D(0, 1), new Vector2D(1, 0), new Vector2D(1, 1)])
      ];

      let numberOfRocks = part == 1 ? 2022 : 1000000000000;
      let mapWidth = 7, maxMapHeight = 40;

      let solConsole = this.solConsole;
      solConsole.addLine(`Number of rocks: ${numberOfRocks}.`);
      let solConsoleLine = solConsole.addLine();

      let pixelMap = new PixelMap(mapWidth, maxMapHeight);
      
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[towerColorIndex] = towerColor;
        pixelMap.palette[rockColorIndex] = rockColor;
      }

      let towerHeight = 0;
      let map = [];
      let jetIndex = 0;
      let situationMap = new Map();
      let cycleFound = false;

      for (let rockNumber = 1; rockNumber <= numberOfRocks; rockNumber++) {
        if (this.isStopping)
          return;

        let rockIndex = (rockNumber - 1) % rocks.length;
        let rock = rocks[rockIndex];

        // Add empty space to map and slice it to fit maximum map height
        for (let i = 0; i < rock.height + 3; i++)
          map.push(new Array(mapWidth).fill(0));
        map = map.slice(Math.max(0, map.length - maxMapHeight), map.length);

        if (visualization) {
          pixelMap.clear();
          for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < mapWidth; x++)
              pixelMap.drawPixel(x, maxMapHeight - y - 1, map[y][x]);
          }
        }

        // Move the rock
        let rockOrigin = new Vector2D(2, map.length - rock.height);
        for (let moveDown = true; moveDown; ) {
          if (this.isStopping)
            return;

          let jet = jets[jetIndex];

          if (visualization) {
            for (let point of rock.points)
              pixelMap.drawPixel(rockOrigin.x + point.x, maxMapHeight - (rockOrigin.y + point.y) - 1, rockColorIndex);
            await delay(20);
            for (let point of rock.points)
              pixelMap.drawPixel(rockOrigin.x + point.x, maxMapHeight - (rockOrigin.y + point.y) - 1, 0);
          }

          // Move the rock left or right
          if (jet == "<" && rock.leftPoints.reduce((acc, p) => acc && rockOrigin.x + p.x > 0 && map[rockOrigin.y + p.y][rockOrigin.x + p.x - 1] == 0, true))
            rockOrigin.x--;
          if (jet == ">" && rock.rightPoints.reduce((acc, p) => acc && rockOrigin.x + p.x < mapWidth - 1 && map[rockOrigin.y + p.y][rockOrigin.x + p.x + 1] == 0, true))
            rockOrigin.x++;

          if (visualization) {
            for (let point of rock.points)
              pixelMap.drawPixel(rockOrigin.x + point.x, maxMapHeight - (rockOrigin.y + point.y) - 1, rockColorIndex);
            await delay(20);
            for (let point of rock.points)
              pixelMap.drawPixel(rockOrigin.x + point.x, maxMapHeight - (rockOrigin.y + point.y) - 1, 0);
          }

          // Move the rock down
          if (rock.bottomPoints.reduce((acc, p) => acc && rockOrigin.y + p.y > 0 && map[rockOrigin.y + p.y - 1][rockOrigin.x + p.x] == 0, true))
            rockOrigin.y--;
          else {
            moveDown = false;

            for (let point of rock.points)
              map[rockOrigin.y + point.y][rockOrigin.x + point.x] = 1;

            // Increase the tower height and slice the map
            towerHeight += Math.max(0, rockOrigin.y + 2 * rock.height - map.length + 3);
            let mapTop = Math.max(map.length - 3 - rock.height, rockOrigin.y + rock.height);
            map = map.slice(Math.max(0, mapTop - maxMapHeight), mapTop);

            solConsoleLine.innerHTML = `Tower height after rock ${rockNumber}: ${towerHeight}.`;

            // Check if the same situation has occured before
            if (!cycleFound) {
              let hash = map.map(line => line.join("")).join("") + "|" + rockIndex + "|" + jetIndex;

              let situation = situationMap.get(hash);
              if (situation != undefined) {
                solConsole.addLine(`Situation after rock ${rockNumber} is the same as after rock ${situation.rockNumber} (tower height ${situation.towerHeight}).`);
                let newRockNumber = situation.rockNumber + Math.floor((numberOfRocks - situation.rockNumber) / (rockNumber - situation.rockNumber)) * (rockNumber - situation.rockNumber);
                let newTowerHeight = situation.towerHeight + Math.floor((numberOfRocks - situation.rockNumber) / (rockNumber - situation.rockNumber)) * (towerHeight - situation.towerHeight);
                rockNumber = newRockNumber;
                towerHeight = newTowerHeight;
                solConsole.addLine(`It will also be the same after rock ${rockNumber} (tower height ${towerHeight}).`);
                solConsoleLine = solConsole.addLine();
                cycleFound = true;
              }
              else
                situationMap.set(hash, new RockNumberAndTowerHeight(rockNumber, towerHeight));
            }
          }

          jetIndex = (jetIndex + 1) % jets.length;
        }
      }

      return towerHeight;
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
 * Puzzle rock class.
 */
class Rock {
  /**
   * @param {Vector2D[]} points Rock points.
   */
  constructor(points) {
    /**
     * Rock points.
     * @type {Vector2D[]}
     */
    this.points = points;
    /**
     * Rock width.
     * @type {number}
     */
    this.width = points.reduce((acc, e) => Math.max(acc, e.x), 0) + 1;
    /**
     * Rock height.
     * @type {number}
     */
    this.height = points.reduce((acc, e) => Math.max(acc, e.y), 0) + 1;
    /**
     * Rock left points.
     * @type {Vector2D[]}
     */
    this.leftPoints = points.filter(p1 => p1.x == 0 || points.find(p2 => p1.y == p2.y && p2.x == p1.x - 1) == undefined);
    /**
     * Rock right points.
     * @type {Vector2D[]}
     */
    this.rightPoints = points.filter(p1 => p1.x == this.width - 1 || points.find(p2 => p1.y == p2.y && p2.x == p1.x + 1) == undefined);
    /**
     * Rock bottom points.
     * @type {Vector2D[]}
     */
    this.bottomPoints = points.filter(p1 => p1.y == 0 || points.find(p2 => p1.x == p2.x && p2.y == p1.y - 1) == undefined);
    /**
     * Rock top points.
     * @type {Vector2D[]}
     */
    this.topPoints = points.filter(p1 => p1.y == this.height - 1 || points.find(p2 => p1.x == p2.x && p2.y == p1.y + 1) == undefined);
  }
}

/**
 * Puzzle rock number and tower height.
 */
class RockNumberAndTowerHeight {
  /**
   * @param {number} rockNumber Rock number.  
   * @param {number} towerHeight Tower height.
   */
  constructor(rockNumber, towerHeight) {
    /**
     * Rock number.
     * @type {number}
     */
    this.rockNumber = rockNumber;
    /**
     * Tower height.
     * @type {number}
     */
    this.towerHeight = towerHeight;
  }
}