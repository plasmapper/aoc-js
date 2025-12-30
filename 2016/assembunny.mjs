/**
 * Assembunny class.
 */
export class Assembunny {
  constructor() {
    /**
     * Instructions.
     * @type {AssembunnyInstruction[]}
     */
    this.instructions = [];
    /**
     * Registers (a, b, c, d).
     * @type {Object<string, number>}
     */
    this.registers = {a: 0, b: 0, c: 0, d: 0};
  }

  /**
   * Parses the assembunny code to the instructions array.
   * @param {string} code Assembunny code.
   */
  parse(code) {
    this.instructions = code.trim().split(/\r?\n/).map((line, index) => {
      let match;
      if ((match = line.match(/^(cpy|jnz) (a|b|c|d|-?\d+) (a|b|c|d|-?\d+)$/)) != null)
        return new AssembunnyInstruction(match[1], [isNaN(match[2]) ? match[2] : parseInt(match[2]), isNaN(match[3]) ? match[3] : parseInt(match[3])]);
      else if ((match = line.match(/^(inc|dec|tgl|out) (a|b|c|d|-?\d+)$/)) != null)
        return new AssembunnyInstruction(match[1], [isNaN(match[2]) ? match[2] : parseInt(match[2])]);
      else
        throw new Error(`Invalid instruction ${index + 1} (${line})`);
    });

    // Optimize mutiplication:
    let registerNames = ["a", "b", "c", "d"];
    
    // Create all register name permutations
    let registerNamePermutations = registerNames.reduce((acc, e1) => [...acc, ...registerNames.reduce((acc, e2) => [...acc, ...registerNames
      .reduce((acc, e3) => [...acc, ...registerNames.reduce((acc, e4) => {
        let permutation = [e1, e2, e3, e4];
        if (permutation.reduce((acc, e) => acc.indexOf(e) < 0 ? [...acc, e] : acc, []).length == permutation.length)
          return [...acc, permutation];
        return acc;
    }, [])], [])], [])], []);
    
    // For all [a, b, c, d] permutation replace |cpy a/const d|inc c/dec d|dec d/inc c|jnz d -2|dec b|jnz b -5| with nop|nop|nop|nop|nop|mul a b c d.
    // nop instruction does nothing
    // mul a b c instruction adds a*b to c and sets b and d to zero
    for (let i = 0; i < this.instructions.length - 2; i++) {
      for (let reg of registerNamePermutations) {
        let instr = this.instructions.slice(i, i + 6);
        if (   instr[0].opcode == "cpy" && (instr[0].operands[0] == reg[0] || typeof instr[0].operands[0] == "number") && instr[0].operands[1] == reg[3]
          && ((instr[1].opcode == "inc" && instr[1].operands[0] == reg[2] && instr[2].opcode == "dec" && instr[2].operands[0] == reg[3]) ||
              (instr[1].opcode == "dec" && instr[1].operands[0] == reg[3] && instr[2].opcode == "inc" && instr[2].operands[0] == reg[2]))
          &&   instr[3].opcode == "jnz" && instr[3].operands[0] == reg[3] && instr[3].operands[1] == -2
          &&   instr[4].opcode == "dec" && instr[4].operands[0] == reg[1]
          &&   instr[5].opcode == "jnz" && instr[5].operands[0] == reg[1] && instr[5].operands[1] == -5) {

          instr[0].opcode = instr[1].opcode = instr[2].opcode = instr[3].opcode = instr[4].opcode = "nop";
          instr[5].opcode = "mul";
          instr[5].operands = [typeof instr[0].operands[0] == "number" ? instr[0].operands[0] : reg[0], reg[1], reg[2], reg[3]];
        }
      }
    }
  }

  /**
   * Runs the instructions.
   * @param {boolean} enableInfiniteLoopTest Enable infinite loop test.
   * @returns {AssembunnyRunResult} Run result.
   */
  run(enableInfiniteLoopTest = false) {
    let instr = this.instructions;
    let reg = this.registers;
    let result = new AssembunnyRunResult();
    let stateMap = new Map();

    if (enableInfiniteLoopTest && instr.some(e => e.opcode == " tgl"))
      throw new Error("Infinite loop test for programs with TGL instruction not implemented");

    for (let i = 0; ; result.clock++, i++) {
      if (i >= instr.length)
        return result;
      if (enableInfiniteLoopTest) {
        let stateHash = `${i}|${reg.a}|${reg.b}|${reg.c}|${reg.d}`;
        let sameStatePreviousClock = stateMap.get(stateHash);
        if (sameStatePreviousClock != undefined) {
          result.infiniteLoopClock = sameStatePreviousClock;
          return result;
        }
        stateMap.set(stateHash, result.clock);
      }

      if (instr[i].opcode == "cpy" && typeof instr[i].operands[1] == "string")
        reg[instr[i].operands[1]] = typeof instr[i].operands[0] == "number" ? instr[i].operands[0] : reg[instr[i].operands[0]];
      else if (instr[i].opcode == "inc")
        reg[instr[i].operands[0]]++;
      else if (instr[i].opcode == "dec")
        reg[instr[i].operands[0]]--;
      else if (instr[i].opcode == "jnz" && (typeof instr[i].operands[0] == "number" ? instr[i].operands[0] : reg[instr[i].operands[0]]) != 0) {
        i = i + (typeof instr[i].operands[1] == "number" ? instr[i].operands[1] : reg[instr[i].operands[1]]) - 1;
        if (i + 1 < instr.length && (instr[i + 1].opcode == "nop" || instr[i + 1].opcode == "mul"))
          throw new Error("JNZ destination is inside the multiplication instruction group");
      }
      else if (instr[i].opcode == "tgl") {
        let instructionToToggleIndex = i + (typeof instr[i].operands[0] == "number" ? instr[i].operands[0] : reg[instr[i].operands[0]]);
        if (instructionToToggleIndex >= 0 && instructionToToggleIndex < instr.length) {
          let instructionToToggle = instr[instructionToToggleIndex];
          if (instructionToToggle.opcode == "nop" || instructionToToggle.opcode == "mul")
            throw new Error("TGL destination is inside the multiplication instruction group");
          if (instructionToToggle.operands.length == 1)
            instructionToToggle.opcode = instructionToToggle.opcode == "inc" ? "dec" : "inc";
          else
            instructionToToggle.opcode = instructionToToggle.opcode == "jnz" ? "cpy" : "jnz";
        }
      }
      else if (instr[i].opcode == "mul") {
        reg[instr[i].operands[2]] += (typeof instr[i].operands[0] == "number" ? instr[i].operands[0] : reg[instr[i].operands[0]]) * reg[instr[i].operands[1]];
        reg[instr[i].operands[1]] = reg[instr[i].operands[3]] = 0;
      }
      else if (instr[i].opcode == "out") {
        result.output.push(new AssembunnyOutput(result.clock, typeof instr[i].operands[0] == "number" ? instr[i].operands[0] : reg[instr[i].operands[0]]));
      }
    }
  }
}

/**
 * Assembunny instruction class.
 */
export class AssembunnyInstruction {
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

/**
 * Assembunny output class.
 */
export class AssembunnyOutput {
  /**
   * @param {number} clock Clock value when out instruction is executed.
   * @param {number} value Output value.
   */
  constructor(clock, value) {
    /**
     * Clock value when out instruction is executed.
     * @type {number}
     */
    this.clock = clock;
    /**
     * Output value.
     * @type {number}
     */
    this.value = value;
  }
}

/**
 * Assembunny run result class.
 */
export class AssembunnyRunResult {
  constructor() {
    /**
     * Final clock value.
     * @type {number}
     */
    this.clock = 0;
    /**
     * Clock value when the state is the same as at the final clock value (undefined if program ends normally).
     * @type {number}
     */
    this.infiniteLoopClock;
    /**
     * Program output.
     * @type {AssembunnyOutput[]}
     */
    this.output = [];
  }
}