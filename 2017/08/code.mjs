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
   * @returns {Instruction[]} Instruction.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let instructions = input.trim().split(/\r?\n/).map((line, index) => {
      let match = line.match(/^([a-z]+) (dec|inc) (-?\d+) if ([a-z]+) (>|<|>=|<=|==|!=) (-?\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return new Instruction(match[1], match[2], parseInt(match[3]), match[4], match[5], parseInt(match[6]))
    });

    consoleLine.innerHTML += " done.";
    return instructions;
  }

  /**
   * Finds the largest register value after completing the instructions (part 1) or the highest value held in any register during this process (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Largest register value after completing the instructions (part 1) or the highest value held in any register during this process (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let instructions = this.parse(input);

      let visConsole = new Console();
      let solConsoleLine1, solConsoleLine2;
      if (visualization) {
        this.visContainer.append(visConsole.container);
        this.solConsole.addLine(`Number of instructions: ${instructions.length}.`);
        solConsoleLine1 = this.solConsole.addLine();
        if (part == 2)
          solConsoleLine2 = this.solConsole.addLine();
      }
      
      let registers = {};
      for (let instruction of instructions) {
        if (!(instruction.arithmeticRegister in registers))
          registers[instruction.arithmeticRegister] = 0;
        if (!(instruction.conditionRegister in registers))
          registers[instruction.conditionRegister] = 0;
      }

      let registerNames = Object.keys(registers);
      if (visualization)
        registerNames.forEach(e => visConsole.addLine());

      let maxRegisterValue = 0;
      for (let instructionIndex = 0; instructionIndex < instructions.length; instructionIndex++) {
        if (this.isStopping)
          return;

        let instruction = instructions[instructionIndex];
        if ((instruction.conditionOperator == ">" && registers[instruction.conditionRegister] > instruction.conditionValue) ||
            (instruction.conditionOperator == "<" && registers[instruction.conditionRegister] < instruction.conditionValue) ||
            (instruction.conditionOperator == ">=" && registers[instruction.conditionRegister] >= instruction.conditionValue) ||
            (instruction.conditionOperator == "<=" && registers[instruction.conditionRegister] <= instruction.conditionValue) ||
            (instruction.conditionOperator == "==" && registers[instruction.conditionRegister] == instruction.conditionValue) ||
            (instruction.conditionOperator == "!=" && registers[instruction.conditionRegister] != instruction.conditionValue)) {

          if (instruction.arithmeticOperator == "inc")
            registers[instruction.arithmeticRegister] += instruction.arithmeticValue;
          if (instruction.arithmeticOperator == "dec")
            registers[instruction.arithmeticRegister] -= instruction.arithmeticValue;
          
          if (part == 2)
            maxRegisterValue = Math.max(maxRegisterValue, registers[instruction.arithmeticRegister]);
        }

        if (visualization) {
          solConsoleLine1.innerHTML = `Instruction: ${instructionIndex + 1}.`;
          if (part == 2)
            solConsoleLine2.innerHTML = `Max register value: ${maxRegisterValue}.`;
          for (let i = 0; i < registerNames.length; i++)
            visConsole.lines[i].innerHTML = `${registerNames[i]} = ${registers[registerNames[i]]}`;
          await delay(1);
        }
      }

      if (part == 1) {
        maxRegisterValue = Math.max(...Object.values(registers));
        if (visualization) {
          let maxValueRegisterIndex = registerNames.findIndex(e => registers[e] == maxRegisterValue);
          visConsole.lines[maxValueRegisterIndex].classList.add("highlighted");
          visConsole.container.scrollTop = visConsole.lines[maxValueRegisterIndex].offsetTop - visConsole.container.offsetHeight / 2;
        }
      }

      return maxRegisterValue;
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
   * @param {string} arithmeticRegister Arithmetic register.
   * @param {string} arithmeticOperator Arithmetic operator.
   * @param {number} arithmeticValue Arithmetic value.
   * @param {string} conditionRegister Condition register.
   * @param {string} conditionOperator Condition operator.
   * @param {number} conditionValue Condition value.
   */
  constructor(arithmeticRegister, arithmeticOperator, arithmeticValue, conditionRegister, conditionOperator, conditionValue) {
    /**
     * Arithmetic register.
     * @type {string}
     */
    this.arithmeticRegister = arithmeticRegister;
    /**
     * Arithmetic operator.
     * @type {string}
     */
    this.arithmeticOperator = arithmeticOperator;
    /**
     * Arithmetic value.
     * @type {number}
     */
    this.arithmeticValue = arithmeticValue;
    /**
     * Condition register.
     * @type {string}
     */
    this.conditionRegister = conditionRegister;
    /**
     * Condition operator.
     * @type {string}
     */
    this.conditionOperator = conditionOperator;
    /**
     * Condition value.
     * @type {number}
     */
    this.conditionValue = conditionValue;
  }
}