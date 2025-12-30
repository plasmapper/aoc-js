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
    this.noPart2 = true;
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

      let assembunny = this.parse(input)

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Increase a until the program contains an infinite loop with 0, 1, 0, 1 ... output
      for (let a = 0; ; a++) {
        assembunny.registers.a = a;
        assembunny.registers.b = assembunny.registers.c = assembunny.registers.d = 0;
        let result = assembunny.run(true);
        if (result.infiniteLoopClock != undefined && result.output.length >= 2 && result.output.reduce((acc, e, i) => acc && e.value == (i % 2 ? 1 : 0), true)) {
          let firstOutputOfInfiniteLoop = result.output.find(e => e.clock >= result.infiniteLoopClock);
          if (firstOutputOfInfiniteLoop != undefined && firstOutputOfInfiniteLoop.value != result.output[result.output.length - 1].value) {
            if (visualization)
              visConsole.addLine(`If a = <span class="highlighted">${a}</span> the program outputs 0, 1, 0, 1... repeating forever.`)
            return a;
          }
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