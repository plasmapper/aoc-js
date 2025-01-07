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
   * @returns {string[]} Strings.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let strings = input.trim().split(/\r?\n/).map((line, index) => {
      if (!/^".*"$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return line;
    });

    consoleLine.innerHTML += " done.";
    return strings;
  }

  /**
   * Finds the sum of differences between code sizes and string sizes.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of differences between code sizes and string sizes.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let strings = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let totalCodeSize = 0;
      let totalStringSize = 0;

      for (let string of strings) {
        let codeSize, stringSize;
        if (part == 1) {
          codeSize = string.length;
          stringSize = string.substring(1, string.length - 1)
          .replaceAll("\\\\", "\\")
          .replaceAll("\\\"", "\"")
          .replaceAll(/\\x[0-9a-f][0-9a-f]/g, ".").length;
        }
        else {
          stringSize = string.length;
          codeSize = string.replaceAll("\\", "\\\\")
            .replaceAll("\"", "\\\"").length + 2;
        }

        totalCodeSize += codeSize;
        totalStringSize += stringSize;

        if (visualization) {
          visConsole.addLine(string);
          visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          visConsole.addLine(`Code size: ${codeSize}, string size: ${stringSize}.`);
          visConsole.addLine();
        }
      }

      return totalCodeSize - totalStringSize;
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