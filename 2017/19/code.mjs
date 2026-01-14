import { delay, Console, Vector2D, PixelMap } from "../../utility.mjs";

const pathColorIndex = 1;
const pathColor = "#999999";
const packetColorIndex = 2;
const packetColor = "#ffffff";
const letterColorIndex = 3;
const letterColor = "#ffff00";

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
   * @returns {{
   * map: number[][],
   * letters: object<string,Vector2D>,
   * }} Map and letters.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let letters = {};
    let map = input.split(/\r?\n/).filter(e => e != "").map((line, index, lines) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);
      if (!/^[A-Z\-\|\+\s]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      let symbols = line.split("");
      for (let x = 0; x < symbols.length; x++) {
        if (/[A-Z]/.test(symbols[x]))
          letters[symbols[x]] = new Vector2D(x, index);
      }
      return symbols.map(e => e != " " ? pathColorIndex : 0);
    });

    if (map.length == 0)
      throw new Error("Invalid input data");

    if (map[0].every(e => e == 0))
      throw new Error("Start not found"); 

    consoleLine.innerHTML += " done.";
    return { map, letters };
  }

  /**
   * Finds the sequence of letters along the path (part 1) or the number of steps (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string|number} Sequence of letters along the path (part 1) or the number of steps (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {map, letters} = this.parse(input);

      let mapWidth = map[0].length, mapHeight = map.length;

      let solConsoleLine;
      let pixelMap = new PixelMap(mapWidth, mapHeight);
      if (visualization) {
        solConsoleLine = this.solConsole.addLine(part == 1 ? "Letter sequence: ." : "Step: 1.");
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[pathColorIndex] = pathColor;
        pixelMap.palette[packetColorIndex] = packetColor;
        pixelMap.palette[letterColorIndex] = letterColor;
        pixelMap.draw(map);
        for (let letter in letters)
          pixelMap.drawPixel(letters[letter].x, letters[letter].y, letterColorIndex);
      }

      let letterSequence = "", step = 1;
      let position = new Vector2D(map[0].indexOf(pathColorIndex), 0);
      let letter = Object.keys(letters).find(e => letters[e].equals(position));
      if (letter != undefined)
        letterSequence += letter;
      if (visualization)
        pixelMap.drawPixel(position.x, position.y, packetColorIndex);

      let direction = new Vector2D(0, 1);
      let directions = [new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(-1, 0), new Vector2D(0, -1)];

      while (1) {
        if (this.isStopping)
          return;

        let nextPosition = [direction, ...directions.filter(e => !e.equals(direction) && !e.equals(direction.clone().multiply(-1)))]
          .map(dir => position.clone().add(dir))
          .filter(nextPosition => nextPosition.x >= 0 && nextPosition.x < mapWidth && nextPosition.y >= 0 && nextPosition.y < mapHeight && map[nextPosition.y][nextPosition.x] != 0)[0];

        if (nextPosition == undefined)
          return part == 1 ? letterSequence : step;

        step++;
        direction = nextPosition.clone().subtract(position);
        position = nextPosition;

        letter = Object.keys(letters).find(e => letters[e].equals(position));
        if (letter != undefined)
          letterSequence += letter;

        if (visualization && pixelMap.image[position.y][position.x] == pathColorIndex) {
          pixelMap.drawPixel(position.x, position.y, packetColorIndex);
          solConsoleLine.innerHTML = part == 1 ? `Letter sequence: ${letterSequence}.` : `Step: ${step}.`;
          await delay(1);
        }
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