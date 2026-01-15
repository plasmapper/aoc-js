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
   * @returns {Instruction[]} Instructions.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let instructions = input.trim().split(/\r?\n/).map((line, index) => {
      let match;
      if ((match = line.match(/^(set|sub|mul) ([a-z]) ([a-z]|-?\d+)$/)) != null)
        return new Instruction(match[1], [isNaN(match[2]) ? match[2] : parseInt(match[2]), isNaN(match[3]) ? match[3] : parseInt(match[3])]);
      if ((match = line.match(/^(jnz) ([a-z]|-?\d+) ([a-z]|-?\d+)$/)) != null)
        return new Instruction(match[1], [isNaN(match[2]) ? match[2] : parseInt(match[2]), isNaN(match[3]) ? match[3] : parseInt(match[3])]);
      else
        throw new Error(`Invalid instruction ${index + 1} (${line})`);
    });

    consoleLine.innerHTML += " done.";
    return instructions;
  }

  /**
   * Finds the number of times the MUL instruction is invoked (part 1) or the result value in register H (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of times the MUL instruction is invoked (part 1) or the result value in register H (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let instructions = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let registers = {a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0, h: 0};
      if (part == 2)
        registers.a = 1;

      let part2Step;
      if (part == 2) {
        if (visualization) {
          visConsole.addLine("Solution is based on the assumption that the result value in register H is the number of non-prime numbers" +
            " found while going from B to C with the step specified in the penultimate instruction.")
          visConsole.addLine();
        }

        if (instructions[instructions.length - 1].opcode != "jnz" || instructions[instructions.length - 2].opcode != "sub")
          throw new Error("Solution not found");
        part2Step = -instructions[instructions.length - 2].operands[1];
        instructions = instructions.slice(0, instructions.length + instructions[instructions.length - 1].operands[1] - 1);
      }

      let numberOfMuls = 0;
      for (let i = 0; i < instructions.length; i++) {
        let opcode = instructions[i].opcode, operands = instructions[i].operands;

        if (opcode == "set")
          registers[operands[0]] = (typeof operands[1] == "number" ? operands[1] : registers[operands[1]]);
        else if (opcode == "sub")
          registers[operands[0]] -= (typeof operands[1] == "number" ? operands[1] : registers[operands[1]]);
        else if (opcode == "mul") {
          registers[operands[0]] *= (typeof operands[1] == "number" ? operands[1] : registers[operands[1]]);
          numberOfMuls++;
        }
        else if (opcode == "jnz" && (typeof operands[0] == "number" ? operands[0] : registers[operands[0]]) != 0)
          i += (typeof operands[1] == "number" ? operands[1] : registers[operands[1]]) - 1;
      }

      if (part == 1) {
        if (visualization)
          visConsole.addLine(`MUL instruction is invoked <span class="highlighted">${numberOfMuls}</span> time${numberOfMuls == 1 ? "" : "s"}.`);
        return numberOfMuls;
      }
      else {
        if (visualization) {
          visConsole.addLine(`B = ${registers.b}.`);
          visConsole.addLine(`C = ${registers.c}.`);
          visConsole.addLine(`Step = ${part2Step}.`);
        }

        let numberOfNonPrimeNumbers = 0;
        for (let i = registers.b; i <= registers.c; i += part2Step) {
          let prime = true;
          for (let x = 2; x < i / 2 && prime; x++) {
            if (i % x == 0)
              prime = false;
          }
          numberOfNonPrimeNumbers += prime ? 0 : 1;
        }
        return numberOfNonPrimeNumbers;
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