import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

const lightColorIndex = 1;
const lightColor = "#ffffff";

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
        throw new Error(`Invalid length of line ${lineIndex + 1}`);
      if (!/^[\.#]+$/.test(line))
        throw new Error(`Invalid data in line ${lineIndex + 1}`);
      return line.split("").map(e => e == "#" ? lightColorIndex : 0);
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds the number of lit lights.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of lit lights.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let map = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;
      let neighbors = map.map((line, y) => line.map((e, x) => [
        new Vector2D(x + 1, y), new Vector2D(x + 1, y + 1), new Vector2D(x, y + 1), new Vector2D(x - 1, y + 1),
        new Vector2D(x - 1, y), new Vector2D(x - 1, y - 1), new Vector2D(x, y - 1), new Vector2D(x + 1, y - 1)
      ].filter(e => e.x >= 0 && e.x < mapWidth && e.y >= 0 && e.y < mapHeight)));

      if (part == 2)
        map[0][0] = map[0][mapWidth - 1] = map[mapHeight - 1][0] = map[mapHeight - 1][mapWidth - 1] = lightColorIndex;

      let numberOfSteps = mapWidth < 10 ? (part == 1 ? 4 : 5) : 100;

      let solConsole = this.solConsole;
      solConsole.addLine(`Number of steps: ${numberOfSteps}.`);
      let solConsoleLine = solConsole.addLine();

      let pixelMap = new PixelMap(mapWidth, mapHeight);

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[lightColorIndex] = lightColor;
        pixelMap.draw(map);
      }

      for (let step = 0; step < numberOfSteps; step++) {
        if (this.isStopping)
          return;

        map = map.map((line, y) => line.map((e, x) => {
          let numberOfLitNeighbors = neighbors[y][x].reduce((acc, n) => acc + (map[n.y][n.x] != 0 ? 1 : 0), 0);
          if (part == 2 && (x == 0 || x == mapWidth - 1) && (y == 0 || y == mapHeight - 1))
            return lightColorIndex;
          return (e != 0 && (numberOfLitNeighbors == 2 || numberOfLitNeighbors == 3)) || (e == 0 && numberOfLitNeighbors == 3) ? lightColorIndex : 0;
        }));

        if (visualization) {
          pixelMap.draw(map);
          await delay(50);
        }

        solConsoleLine.innerHTML = `Step: ${step + 1}.`;
      }

      return map.reduce((acc, line) => acc + line.reduce((lineAcc, e) => lineAcc + (e != 0 ? 1 : 0), 0), 0);
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