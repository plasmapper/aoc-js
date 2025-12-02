import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

const litPixelColorIndex = 1;
const litPixelColor = "#ffffff";

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
      if ((match = line.match(/^rect (\d+)x(\d+)$/)) != null)
        return new Instruction("rect", parseInt(match[1]), parseInt(match[2]));
      else if ((match = line.match(/^rotate row y=(\d+) by (\d+)$/)) != null)
        return new Instruction("rotate row", parseInt(match[1]), parseInt(match[2]));
      else if ((match = line.match(/^rotate column x=(\d+) by (\d+)$/)) != null)
        return new Instruction("rotate column", parseInt(match[1]), parseInt(match[2]));
      else
        throw new Error(`Invalid instruction ${index + 1}`);
    });

    consoleLine.innerHTML += " done.";
    return instructions;
  }

  /**
   * Finds the number of lit pixels (part 1) or the screen image (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number|string} Number of lit pixels (part 1) or the screen image (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let instructions = this.parse(input);
      let screenDimensions = instructions.length < 10 ? new Vector2D(7, 3) : new Vector2D(50, 6);

      let solConsole = this.solConsole;
      solConsole.addLine(`Number of instructions: ${instructions.length}.`);
      let solConsoleLine = solConsole.addLine();

      let pixelMap = new PixelMap(screenDimensions.x, screenDimensions.y);

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[litPixelColorIndex] = litPixelColor;
      }

      for (let i = 0; i < instructions.length; i++) {
        if (this.isStopping)
          return;

        let instruction = instructions[i];
        
        if (instruction.action == "rect") {
          for (let x = 0; x < instruction.parameter1; x++) {
            for (let y = 0; y < instruction.parameter2; y++) {
              if (visualization)
                pixelMap.drawPixel(x, y, litPixelColorIndex);
              else
                pixelMap.image[y][x] = litPixelColorIndex;
            }
          }
        }

        if (instruction.action == "rotate row") {
          let newRow = pixelMap.image[instruction.parameter1].map((e, i) => pixelMap.image[instruction.parameter1][(i + pixelMap.width - instruction.parameter2) % pixelMap.width]);
          if (visualization)
            newRow.forEach((e, x) => pixelMap.drawPixel(x, instruction.parameter1, e));
          else
            newRow.forEach((e, x) => pixelMap.image[instruction.parameter1][x] = e);
        }

        if (instruction.action == "rotate column") {
          let newColumn = pixelMap.image.map((e, i) => pixelMap.image[(i + pixelMap.height - instruction.parameter2) % pixelMap.height][instruction.parameter1]);
          if (visualization)
            newColumn.forEach((e, y) => pixelMap.drawPixel(instruction.parameter1, y, e));
          else
            newColumn.forEach((e, y) => pixelMap.image[y][instruction.parameter1] = e);
        }

        solConsoleLine.innerHTML = `Instruction: ${i + 1}.`;

        if (visualization)
          await delay(1);
      }

      if (part == 1)
        return pixelMap.image.reduce((acc, line) => acc + line.reduce((lineAcc, e) => lineAcc + (e ? 1 : 0), 0), 0);
      else
        return `\n${pixelMap.image.map(line => line.map(e => e != 0 ? "#" : ".").join("")).join("\n")}\n`
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
   * @param {number} parameter1 Parameter 1.
   * @param {number} parameter2 Parameter 2.
   */
  constructor(action, parameter1, parameter2) {
    /**
     * Action.
     * @type {string}
     */
    this.action = action;
    /**
     * Parameter 1.
     * @type {number}
     */
    this.parameter1 = parameter1;
    /**
     * Parameter 2.
     * @type {number}
     */
    this.parameter2 = parameter2;
  }
}