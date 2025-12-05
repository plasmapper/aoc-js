import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

const letterSize = 5;
const letterSymbols = {
  X : [[1, 0, 0, 0, 1], [0, 1, 0, 1, 0], [0, 0, 1, 0, 0], [0, 1, 0, 1, 0],  [1, 0, 0, 0, 1]],
  M : [[1, 0, 0, 0, 1], [1, 1, 0, 1, 1], [1, 0, 1, 0, 1], [1, 0, 0, 0, 1],  [1, 0, 0, 0, 1]],
  A : [[0, 1, 1, 1, 0], [1, 0, 0, 0, 1], [1, 1, 1, 1, 1], [1, 0, 0, 0, 1],  [1, 0, 0, 0, 1]],
  S : [[0, 1, 1, 1, 1], [1, 0, 0, 0, 0], [0, 1, 1, 1, 0], [0, 0, 0, 0, 1],  [1, 1, 1, 1, 0]]
}

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
   * @returns {Letter[][]} Letter map.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let map = input.trim().split(/\r?\n/).map((line, index, lines) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);
      return line.split("").map((letter, letterIndex) => {
        if (letter in letterSymbols)
          return new Letter(letter, new Vector2D(letterIndex, index));
        throw new Error(`Invalid data in line ${index + 1}`);
      });
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds the number of XMAS (part 1) or X-MAS (part 2) patterns.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of XMAS (part 1) or X-MAS (part 2) patterns.
   */
  async solve(part, input, visualization) {
    const letterColorIndex = 1;
    const letterColor = "#00aa00";
    const highlightColorIndex = 2;
    const highlightColor = "#ffffff";

    try {
      this.isSolving = true;

      let map = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;

      let solConsole = this.solConsole;

      let pixelMap = new PixelMap(mapWidth * (letterSize + 1) - 1, mapHeight * (letterSize + 1) - 1);

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[letterColorIndex] = letterColor;
        pixelMap.palette[highlightColorIndex] = highlightColor;

        for (let y = 0; y < mapHeight; y++) {
          for (let x = 0; x < mapWidth; x++) {
            map[y][x].draw(pixelMap, letterColorIndex);
          }
        }
      }

      let solConsoleLine = solConsole.addLine();
      let numberOfPatterns = 0;
      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          if (this.isStopping)
            return;

          let position = new Vector2D(x, y);

          let patterns = [];

          // XMAS patterns
          if (part == 1) {
            let allDirections = [
              new Vector2D(1, 0), new Vector2D(1, 1), new Vector2D(0, 1), new Vector2D(-1, 1),
              new Vector2D(-1, 0), new Vector2D(-1, -1), new Vector2D(0, -1), new Vector2D(1, -1)
            ];

            for (let direction of allDirections) {
              let word = "XMAS";
              let pattern = [];
              for (let i = 0; i < word.length; i++)
                pattern.push(new Letter(word[i], position.clone().add(direction.clone().multiply(i))));
              patterns.push(pattern);
            }
          }
          // X-MAS patterns
          else {
            let center = position.clone();
            let topLeft = position.clone().add(new Vector2D(-1, -1));
            let topRight = position.clone().add(new Vector2D(1, -1));
            let bottomLeft = position.clone().add(new Vector2D(-1, 1));
            let bottomRight = position.clone().add(new Vector2D(1, 1));
            patterns = [
              [new Letter("A", center), new Letter("M", topLeft), new Letter("M", topRight), new Letter("S", bottomLeft), new Letter("S", bottomRight)],
              [new Letter("A", center), new Letter("M", topLeft), new Letter("S", topRight), new Letter("M", bottomLeft), new Letter("S", bottomRight)],
              [new Letter("A", center), new Letter("S", topLeft), new Letter("M", topRight), new Letter("S", bottomLeft), new Letter("M", bottomRight)],
              [new Letter("A", center), new Letter("S", topLeft), new Letter("S", topRight), new Letter("M", bottomLeft), new Letter("M", bottomRight)]
            ];
          }

          // Filter out patterns that go outside the map
          patterns = patterns.filter(pattern => pattern.reduce((acc, letter) => acc &&
            letter.position.x >= 0 && letter.position.x < map[0].length && letter.position.y >= 0 && letter.position.y < map.length, true));

          // Find matching patterns
          for (let pattern of patterns) {
            if (pattern.reduce((acc, letter) => acc && map[letter.position.y][letter.position.x].string == letter.string, true)) {
              if (visualization) {
                for (let letter of pattern)
                  map[letter.position.y][letter.position.x].draw(pixelMap, highlightColorIndex)
                await delay(1);
              }  
              numberOfPatterns++;
            }

            solConsoleLine.innerHTML = `Number of patterns: ${numberOfPatterns}.`;
          }
        }
      }

      return numberOfPatterns;
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
 * Letter class.
 */
class Letter {
  /**
   * @param {string} string Letter string.
   * @param {Vector2D} position Letter position.
   */
  constructor(string, position) {
    /**
     * Letter string.
     * @type {string}
     */
    this.string = string;
    /**
     * Letter position.
     * @type {Vector2D}
     */
    this.position = position;
  }

  /**
   * Draws the letter on the pixel map.
   * @param {PixelMap} pixelMap Pixel map.
   * @param {number} colorIndex Color index.
   */
  draw(pixelMap, colorIndex) {
    for (let symbolY = 0; symbolY < letterSize; symbolY++) {
      for (let symbolX = 0; symbolX < letterSize; symbolX++)
        pixelMap.drawPixel(this.position.x * (letterSize + 1) + symbolX, this.position.y * (letterSize + 1) + symbolY, letterSymbols[this.string][symbolY][symbolX] ? colorIndex : 0);
    }
  }
}
