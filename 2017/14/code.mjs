import { delay, Console, Vector2D, PixelMap } from "../../utility.mjs";

const usedSquareColorIndex = 1;
const usedSquareColor = "#999999";
const regionColors = ["#999999", "#ffffff", "#00aa00", "#ffff00"];

export default class  {
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
   * @returns {string} Key string.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let keyString = input.trim();

    consoleLine.innerHTML += " done.";
    return keyString;
  }


  /**
   * Finds the number of used grid squares (part 1) or the number of regions (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of used grid squares (part 1) or the number of regions (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let keyString = this.parse(input);

      let pixelMap = new PixelMap(128, 128);
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[usedSquareColorIndex] = usedSquareColor;
        regionColors.forEach((e, i) => pixelMap.palette[usedSquareColorIndex + 1 + i] = e);
      }

      let numberOfUsedSquares = 0;

      // Calculate hashes and draw the map
      for (let y = 0; y < pixelMap.height; y++) {
        let lengths = [...`${keyString}-${y}`.split("").map(e => e.charCodeAt(0)), 17, 31, 73, 47, 23];
        let list = new Array(256).fill(null).map((e, i) => i);
        let currentPosition = 0, skipSize = 0;
        for (let round = 0; round < 64; round++) {
          for (let length of lengths) {
            let newList = list.slice();
            for (let i = 0; i < length; i++)
              newList[(currentPosition + i) % list.length] = list[(currentPosition + length - 1 - i) % list.length];
            list = newList;
            currentPosition = (currentPosition + length + (skipSize++)) % list.length;
          }
        }        
        let denseHash = [];
        for (let i = 0; i < 16; i++)
          denseHash.push(...list.slice(i * 16, (i + 1) * 16).reduce((acc, e) => acc ^ e, 0).toString(2).padStart(8, "0").split("").map(e => e != "0" ? 1 : 0));

        numberOfUsedSquares += denseHash.reduce((acc, e) => acc += e, 0);
        
        denseHash.forEach((e, x) => pixelMap.drawPixel(x, y, e != 0 ? usedSquareColorIndex : 0));
      }
      
      // Fill the regions in the map
      if (part == 1)
        return numberOfUsedSquares;

      let regionIndex = 2;
      for (let x = 0; x < pixelMap.width; x++) {
        for (let y = 0; y < pixelMap.height; y++) {
          if (pixelMap.image[y][x] == 1) {
            let squares = [new Vector2D(x, y)];
            while (squares.length) {
              let newSquares = [];
              for (let square of squares) {
                [new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(-1, 0), new Vector2D(0, -1)]
                  .map(e => e.add(square))
                  .filter(e => e.x >= 0 && e.x < pixelMap.width && e.y >= 0 && e.y < pixelMap.height && pixelMap.image[e.y][e.x] == 1)
                  .forEach(e => {
                    newSquares.push(e);
                    pixelMap.image[e.y][e.x] = regionIndex
                  });
              }
              squares = newSquares;
            }
            regionIndex++;
          }
        }
      }

      if (visualization) {
        for (let x = 0; x < pixelMap.width; x++) {
          for (let y = 0; y < pixelMap.height; y++) {
            if (pixelMap.image[y][x] != 0)
              pixelMap.drawPixel(x, y, usedSquareColorIndex + 1 + (pixelMap.image[y][x] % regionColors.length));
          }
        }
      }

      return regionIndex - 2;
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