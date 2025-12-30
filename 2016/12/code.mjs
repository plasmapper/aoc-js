import { delay, Console } from "../../utility.mjs";
import { Assembunny } from "../assembunny.mjs";

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
   * @returns {Assembunny} Assembunny.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let assembunny = new Assembunny();
    assembunny.parse(input);

    consoleLine.innerHTML += " done.";
    return assembunny;
  }

  /**
   * Finds the value in register a after the execution of the instructions.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Value in register a after the execution of the instructions.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let assembunny = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      assembunny.registers.c = part == 1 ? 0 : 1;
      assembunny.run();

      if (visualization) {
        for (let register in assembunny.registers) {
          visConsole.addLine(`${register}: ${assembunny.registers[register]}.`);
          if (register == "a")
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
        }
      }

      return assembunny.registers.a;
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