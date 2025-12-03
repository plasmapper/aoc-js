import { delay, Console } from "../../utility.mjs";

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
      if ((match = line.match(/^cpy (a|b|c|d|\d+) (a|b|c|d)$/)) != null) {
        if (isNaN(match[1]))
          return new Instruction("cpy", [match[1], match[2]]);
        else
          return new Instruction("set", [parseInt(match[1]), match[2]]);
      }        
      else if ((match = line.match(/^(inc|dec) (a|b|c|d)$/)) != null)
        return new Instruction(match[1], [match[2]]);
      else if ((match = line.match(/^jnz (a|b|c|d|\d+) (-?\d+)$/)) != null) {
        if (isNaN(match[1]))
          return new Instruction("jnz", [match[1], parseInt(match[2])]);
        else
          return new Instruction("jmp", [parseInt(match[1]), parseInt(match[2])]);
      }
      else
        throw new Error(`Invalid instruction ${index + 1}`);
    });

    consoleLine.innerHTML += " done.";
    return instructions;
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

      let instructions = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let memory = {a: 0, b: 0, c: part == 1 ? 0 : 1, d: 0};

      for (let i = 0; i < instructions.length; i++) {
        if (instructions[i].opcode == "set")
          memory[instructions[i].operands[1]] = instructions[i].operands[0];
        else if (instructions[i].opcode == "cpy")
          memory[instructions[i].operands[1]] = memory[instructions[i].operands[0]];
        else if (instructions[i].opcode == "inc")
          memory[instructions[i].operands[0]]++;
        else if (instructions[i].opcode == "dec")
          memory[instructions[i].operands[0]]--;
        else if (instructions[i].opcode == "jmp" && instructions[i].operands[0] != 0)
          i = i + instructions[i].operands[1] - 1;
        else if (instructions[i].opcode == "jnz" && memory[instructions[i].operands[0]] != 0)
          i = i + instructions[i].operands[1] - 1;
      }

      if (visualization) {
        for (let register in memory) {
          visConsole.addLine(`${register}: ${memory[register]}.`);
          if (register == "a")
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
        }
      }

      return memory.a;
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
   * @param {string} opcode Opcode.
   * @param {number|string[]} operands Operands.
   */
  constructor(opcode, operands) {
    /**
     * Opcode.
     * @type {string}
     */
    this.opcode = opcode;
    /**
     * Operands.
     * @type {number|string[]}
     */
    this.operands = operands;
  }
}