import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

const paperRollColorIndex = 1;
const paperRollColor = "#999999";
const accessiblePaperRollColorIndex = 2;
const accessiblePaperRollColor = "#ffffff";

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

    let map = input.trim().split(/\r?\n/).map((line, index, lines) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);
      if (!/^[\.\@]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return line.split("").map(e => e == "@" ? paperRollColorIndex : 0);
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds the number of rolls of paper that can be accessed by a forklift (part 1) or removed by a forklift (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of rolls of paper that can be accessed by a forklift (part 1) or removed by a forklift (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let map = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;

      let solConsole = this.solConsole;
      let solConsoleLine = solConsole.addLine();

      let pixelMap = new PixelMap(mapWidth, mapHeight);
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[paperRollColorIndex] = paperRollColor;
        pixelMap.palette[accessiblePaperRollColorIndex] = accessiblePaperRollColor;
      }

      let neighbors = map.map((line, y) => line.map((e, x) => [
          new Vector2D(x + 1, y), new Vector2D(x + 1, y + 1), new Vector2D(x, y + 1), new Vector2D(x - 1, y + 1),
          new Vector2D(x - 1, y), new Vector2D(x - 1, y - 1), new Vector2D(x, y - 1), new Vector2D(x + 1, y - 1)
        ].filter(e => e.x >= 0 && e.x < mapWidth && e.y >= 0 && e.y < mapHeight)));

      let numberOfAccessiblePaperRolls = 0, numberOfRemovedPaperRolls = 0;
      do {
        if (this.isStopping)
          return;

        numberOfAccessiblePaperRolls = 0;
        
        for (let x = 0; x < mapWidth; x++) {
          for (let y = 0; y < mapHeight; y++) {
            if (map[y][x] != 0 && neighbors[y][x].reduce((acc, e) => acc + (map[e.y][e.x] != 0 ? 1 : 0), 0) < 4) {
              map[y][x] = accessiblePaperRollColorIndex;
              numberOfAccessiblePaperRolls++;
            }
          }
        }

        if (part == 2) {
          map = map.map(line => line.map(e => e == accessiblePaperRollColorIndex ? 0 : e));
          numberOfRemovedPaperRolls += numberOfAccessiblePaperRolls;
          solConsoleLine.innerHTML = `Number of removed paper rolls: ${numberOfRemovedPaperRolls}.`;
        }

        if (visualization) {
          pixelMap.draw(map);
          await delay(20);
        }
      } while (part == 2 && numberOfAccessiblePaperRolls > 0);


      return part == 1 ? numberOfAccessiblePaperRolls : numberOfRemovedPaperRolls;
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