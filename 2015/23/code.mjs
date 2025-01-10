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
   * @returns {Command[]} Program.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let program = input.trim().split(/\r?\n/).map((line, index) => {
      let match;
      if ((match = line.match(/^(hlf|tpl|inc) (a|b)$/)) != null)
        return new Command(match[1], match[2], null);
      else if ((match = line.match(/^jmp ((\+|\-)\d+)$/)) != null)
        return new Command("jmp", null, parseInt(match[1]));
      else if ((match = line.match(/^(jie|jio) (a|b), ((\+|\-)\d+)$/)) != null)
        return new Command(match[1], match[2], parseInt(match[3]));
      else
        throw new Error(`Invalid data in line ${index + 1}`);
    });

    consoleLine.innerHTML += " done.";
    return program;
  }

  /**
   * Finds the value in register b when the program is finished.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Value in register b when the program is finished.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let program = this.parse(input);
     
      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let i = 0, a = (part == 1 ? 0 : 1), b = 0;
      for (; i >= 0 && i < program.length; i++) {
        let command = program[i];

        if (visualization) {
          visConsole.addLine(`a = ${a}, b = ${b}, i = ${i}`);
          visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
        }
        let commandString = `${command.instruction} ${command.register}`;

        if (command.instruction == "hlf")
          command.register == "a" ? (a >>= 1) : (b >>= 1);
        if (command.instruction == "tpl")
          command.register == "a" ? (a *= 3) : (b *= 3);
        if (command.instruction == "inc")
          command.register == "a" ? (a++) : (b++);
        if (command.instruction == "jmp") {
          commandString = `jmp ${command.value >= 0 ? "+" : "-"}${command.value}`;
          i += (command.value - 1);
        }
        if (command.instruction == "jie") {
          commandString = `jie ${command.register}, ${command.value >= 0 ? "+" : "-"}${command.value}`;
          if ((command.register == "a" ? a : b) % 2 == 0)
            i += (command.value - 1);
          else
            commandString += " (ignored)";
        }
        if (command.instruction == "jio") {
          commandString = `jio ${command.register}, ${command.value >= 0 ? "+" : ""}${command.value}`;
          if ((command.register == "a" ? a : b) == 1)
            i += (command.value - 1);
          else
            commandString += " (ignored)";
        }

        if (visualization)
          visConsole.addLine(commandString);
      }

      if (visualization) {
        visConsole.addLine(`\nEnd of program (i = ${i}, b = ${b}).`);
        visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
      }

      return b;
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
 * Puzzle command class.
 */
class Command {
  /**
   * @param {string} instruction Instruction.
   * @param {string} register Register.
   * @param {number} value Value.
   */
  constructor(instruction, register, value) {
    /**
     * Instruction.
     * @type {string}
     */
    this.instruction = instruction;
    /**
     * Register.
     * @type {string}
     */
    this.register = register;
    /**
     * Value.
     * @type {number}
     */
    this.value = value;
  }
}