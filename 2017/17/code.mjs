import { delay, Console } from "../../utility.mjs";

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
   * @returns {number} Number of steps.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    input = input.trim();
    if (!/^\d+$/.test(input))
      throw new Error("Invalid input data");
    let numberOfSteps = parseInt(input);

    consoleLine.innerHTML += " done.";
    return numberOfSteps;
  }

  /**
   * Finds the value after 2017 in the buffer after 2017th insert (part 1) or the value after 0 in the buffer after 50000000th insert (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string} Value after 2017 in the buffer after 2017th insert (part 1) or the value after 0 in the buffer after 50000000th insert (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let numberOfSteps = this.parse(input);
      let numberOfInserts = part == 1 ? 2017 : 50000000;

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let position = 0;

      if (part == 1) {
        let buffer = [0];
        for (let i = 1; i <= numberOfInserts; i++) {
          position = (position + numberOfSteps) % i;
          buffer.splice(position++, 0, i);
        }

        if (visualization) {
          for (let value of buffer)
            visConsole.addLine(value);
          visConsole.lines[buffer.indexOf(2017)].classList.add("highlighted");
          visConsole.lines[(buffer.indexOf(2017) + 1) % buffer.length].classList.add("strongly-highlighted");
          visConsole.container.scrollTop = visConsole.lines[(buffer.indexOf(2017) + 1) % buffer.length].offsetTop - visConsole.container.offsetHeight / 2;
        }

        return buffer[(buffer.indexOf(2017) + 1) % buffer.length];
      }
      else {
        let valueInsertedAfterZero;
        for (let i = 1; i <= numberOfInserts; i++) {
          position = (position + numberOfSteps) % i;
          if ((position++) == 0) {
            valueInsertedAfterZero = i;
            if (visualization)
              visConsole.addLine(`${i} is inserted after 0.`)
          }
        }

        if (visualization) {
          visConsole.lines[visConsole.lines.length - 1].innerHTML = `<span class="highlighted">${valueInsertedAfterZero}</span> is inserted after 0.`;
          visConsole.container.scrollTop = visConsole.lines[visConsole.lines.length - 1].offsetTop - visConsole.container.offsetHeight / 2;          
        }

        return valueInsertedAfterZero;
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