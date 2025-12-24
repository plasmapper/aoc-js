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
      if ((match = line.match(/^(cpy|jnz) (a|b|c|d|-?\d+) (a|b|c|d|-?\d+)$/)) != null)
        return new Instruction(match[1], [isNaN(match[2]) ? match[2] : parseInt(match[2]), isNaN(match[3]) ? match[3] : parseInt(match[3])]);
      else if ((match = line.match(/^(inc|dec|tgl) (a|b|c|d|-?\d+)$/)) != null)
        return new Instruction(match[1], [isNaN(match[2]) ? match[2] : parseInt(match[2])]);
      else
        throw new Error(`Invalid instruction ${index + 1} ${line}`);
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

      let memory = {a: part == 1 ? 7 : 12, b: 0, c: 0, d: 0};
      let registerNames = ["a", "b", "c", "d"];
      
      // Create all register name permutations
      let registerNamePermutations = registerNames.reduce((acc, e1) => [...acc, ...registerNames.reduce((acc, e2) => [...acc, ...registerNames
        .reduce((acc, e3) => [...acc, ...registerNames.reduce((acc, e4) => {
          let permutation = [e1, e2, e3, e4];
          if (permutation.reduce((acc, e) => acc.indexOf(e) < 0 ? [...acc, e] : acc, []).length == permutation.length)
            return [...acc, permutation];
          return acc;
      }, [])], [])], [])], []);
      
      // Optimize instructions:
      // For all [a, b, c, d] permutation replace |cpy a d|inc c/dec d|dec d/inc c|jnz d -2|dec b|jnz b -5| with nop|nop|nop|nop|nop|mul a b c.
      // nop instruction does nothing
      // mul a b c instruction adds a*b to c and sets b and d to zero
      for (let i = 0; i < instructions.length - 2; i++) {
        for (let reg of registerNamePermutations) {
          let instr = instructions.slice(i, i + 6);
          if (   instr[0].opcode == "cpy" && instr[0].operands[0] == reg[0] && instr[0].operands[1] == reg[3]
            && ((instr[1].opcode == "inc" && instr[1].operands[0] == reg[2] && instr[2].opcode == "dec" && instr[2].operands[0] == reg[3]) ||
                (instr[1].opcode == "dec" && instr[1].operands[0] == reg[3] && instr[2].opcode == "inc" && instr[2].operands[0] == reg[2]))
            &&   instr[3].opcode == "jnz" && instr[3].operands[0] == reg[3] && instr[3].operands[1] == -2
            &&   instr[4].opcode == "dec" && instr[4].operands[0] == reg[1]
            &&   instr[5].opcode == "jnz" && instr[5].operands[0] == reg[1] && instr[5].operands[1] == -5) {

            instr[0].opcode = instr[1].opcode = instr[2].opcode = instr[3].opcode = instr[4].opcode = "nop";
            instr[5].opcode = "mul";
            instr[5].operands = [reg[0], reg[1], reg[2]];
          }
        }
      }

      for (let i = 0; i < instructions.length; i++) {
        if (instructions[i].opcode == "cpy" && typeof instructions[i].operands[1] == "string")
          memory[instructions[i].operands[1]] = typeof instructions[i].operands[0] == "number" ? instructions[i].operands[0] : memory[instructions[i].operands[0]];
        else if (instructions[i].opcode == "inc")
          memory[instructions[i].operands[0]]++;
        else if (instructions[i].opcode == "dec")
          memory[instructions[i].operands[0]]--;
        else if (instructions[i].opcode == "jnz" && (typeof instructions[i].operands[0] == "number" ? instructions[i].operands[0] : memory[instructions[i].operands[0]]) != 0) {
          i = i + (typeof instructions[i].operands[1] == "number" ? instructions[i].operands[1] : memory[instructions[i].operands[1]]) - 1;
          if (i + 1 < instructions.length && (instructions[i + 1].opcode == "nop" || instructions[i + 1].opcode == "mul"))
            throw new Error("Multiplication optimization failed");
        }
        else if (instructions[i].opcode == "tgl") {
          let instructionToToggleIndex = i + (typeof instructions[i].operands[0] == "number" ? instructions[i].operands[0] : memory[instructions[i].operands[0]]);
          if (instructionToToggleIndex >= 0 && instructionToToggleIndex < instructions.length) {
            let instructionToToggle = instructions[instructionToToggleIndex];
            if (instructionToToggle.opcode == "nop" || instructionToToggle.opcode == "mul")
              throw new Error("Multiplication optimization failed");
            if (instructionToToggle.operands.length == 1)
              instructionToToggle.opcode = instructionToToggle.opcode == "inc" ? "dec" : "inc";
            else
              instructionToToggle.opcode = instructionToToggle.opcode == "jnz" ? "cpy" : "jnz";
          }
        }
        else if (instructions[i].opcode == "mul") {
          memory[instructions[i].operands[2]] += memory[instructions[i].operands[0]] * memory[instructions[i].operands[1]];
          memory[instructions[i].operands[1]] = memory[instructions[i].operands[3]] = 0;
        }
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