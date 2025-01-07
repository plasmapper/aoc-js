import { delay, Console, PixelMap, Range2D } from "../../utility.mjs";

const mapSize = 1000;
const maxBrightness = 100;

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
   * @returns {Instruction[]} Instructions.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let instructions = input.trim().split(/\r?\n/).map((line, index) => {
      let match;
      if ((match = line.match(/^(turn on|turn off|toggle) (\d+),(\d+) through (\d+),(\d+)$/)) == null)
        throw new Error(`Invalid data in line ${index + 1}`);

      let range = new Range2D(parseInt(match[2]), parseInt(match[4]), parseInt(match[3]), parseInt(match[5]));
      if (range.x.from > range.x.to || range.x.to >= mapSize || range.y.from > range.y.to || range.y.to >= mapSize)
        throw new Error(`Invalid data in line ${index + 1}`);
      
      return new Instruction(match[1], range);
    });

    consoleLine.innerHTML += " done.";
    return instructions;
  }

  /**
   * Finds the number of lit lights (part 1) or the total brightness (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of lit lights (part 1) or the total brightness (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let instructions = this.parse(input);

      let solConsole = this.solConsole;
      solConsole.addLine(`Number of instructions: ${instructions.length}.`);
      let solConsoleLine = solConsole.addLine();

      let pixelMap = new PixelMap(mapSize, mapSize);

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        for (let i = 1; i <= maxBrightness; i++) {
          let pixelBrightness = 10 + i / maxBrightness * 245;
          pixelMap.palette[i] = `rgb(${pixelBrightness}, ${pixelBrightness}, ${pixelBrightness})`;
        }
      }

      for (let i = 0; i < instructions.length; i++) {
        if (this.isStopping)
          return;

        let instruction = instructions[i];

        let action;
        if (part == 1)
          action = instruction.action == "turn on" ? () => maxBrightness : (instruction.action == "turn off" ? () => 0 : value => maxBrightness - value);
        else
          action = instruction.action == "turn on" ? value => value + 1 : (instruction.action == "turn off" ? value => Math.max(0, value - 1) : value => value + 2);

        for (let y = instruction.range.y.from; y <= instruction.range.y.to; y++) {
          for (let x = instruction.range.x.from; x <= instruction.range.x.to; x++) {
            if (visualization)
              pixelMap.drawPixel(x, y, action(pixelMap.image[y][x]));
            else
              pixelMap.image[y][x] = action(pixelMap.image[y][x]);
          }
        }

        solConsoleLine.innerHTML = `Instruction: ${i + 1}`;

        if (visualization)
          await delay(1);
      }

      return pixelMap.image.reduce((acc, line) => acc + line.reduce((lineAcc, e) => lineAcc + e / (part == 1 ? maxBrightness : 1), 0), 0);
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
 * Puzzle instruction class.
 */
class Instruction {
  /**
   * @param {string} action Action.
   * @param {Range2D} range Range.
   */
  constructor(action, range) {
    /**
     * Action
     * @type {string}
     */
    this.action = action;
    /**
     * Range.
     * @type {Range2D}
     */
    this.range = range;
  }
}