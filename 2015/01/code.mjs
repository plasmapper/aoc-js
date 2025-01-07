import { delay, Console } from "../../utility.mjs";

const patternWidth = 5;
const patternHeight = 7;

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
   * @returns {string} Instructions.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let instructions = input.trim();
  if (!/^[\(\)]+$/.test(instructions))
    throw new Error("Invalid input data");

  consoleLine.innerHTML += " done.";
  return instructions;
}

  /**
   * Finds the result floor (part 1) or the instruction number that makes the floor number negative (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Result floor (part 1) or the instruction number that makes the floor number negative (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let instructions = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let floor = 0;
      let instructionIndex = 0;
      for (; instructionIndex < instructions.length && (part == 1 || floor >= 0); instructionIndex++) {
        let instruction = instructions[instructionIndex];
        floor += instruction == "(" ? 1 : -1;

        if (visualization)
          visConsole.addLine(`${instructionIndex + 1}: ${instruction} -> ${floor}`);
      }

      if (part == 2 && floor >= 0)
        throw new Error("Negative floor number not found");

      return part == 1 ? floor : instructionIndex;
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