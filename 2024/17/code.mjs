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
   * @returns {{
   * registerA: BigInt,
   * registerB: BigInt,
   * registerC: BigInt,
   * program: number[]
   * }} RegisterA, register B, register C and program.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    input = input.trim();
    let match = input.match(/^Register A: (\d+)\r?\nRegister B: (\d+)\r?\nRegister C: (\d+)\r?\n\r?\nProgram: (\d(,\d)+)$/);
    if (match == null)
      throw new Error("Input structure is not valid");
    
    let registerA = BigInt(parseInt(match[1]));
    let registerB = BigInt(parseInt(match[2]));
    let registerC = BigInt(parseInt(match[3]));
    let program = match[4].split(",").map(e => parseInt(e));
    if (program.length % 2 != 0)
      throw new Error("Invalid program size");
  
    consoleLine.innerHTML += " done.";
    return { registerA, registerB, registerC, program };
  }

  /**
   * Finds the program output (part 1) or calculates the required value of register A so that the program outputs itself (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string|number} Program output (part 1) or the required value of register A so that the program outputs itself (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let { registerA, registerB, registerC, program } = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Find program output (part 1)
      if (part == 1) {
        if (visualization) {
          visConsole.addLine(`A = ${registerA}`);
          visConsole.addLine(`B = ${registerB}`);
          visConsole.addLine(`C = ${registerC}`);
          visConsole.addLine();
        }

        let output = [];
        for (let instructionPointer = 0; instructionPointer < program.length;) {
          if (this.isStopping)
            return;

          let instruction = program[instructionPointer];
          let literalOperand = BigInt(program[instructionPointer + 1]);
          if (instruction > 7 || literalOperand > 7n || (instruction == 3 && literalOperand % 2n != 0))
            throw new Error(`Invalid instruction ${instruction},${literalOperand})`);
  
          let comboOperand = literalOperand;
          let comboOperandString = `${literalOperand}`;
          if (literalOperand == 4) {
            comboOperand = registerA;
            comboOperandString = "A";
          }
          if (literalOperand == 5) {
            comboOperand = registerB;
            comboOperandString = "B";
          }
          if (literalOperand == 6) {
            comboOperand = registerC;
            comboOperandString = "C";
          }
          
          let instructionString = "";
          switch (instruction) {
            case 0: // adv
              registerA >>= comboOperand;
              instructionString = `A >>= ${comboOperandString}`;
              break;
            case 1: // bxl
              registerB ^= literalOperand;
              instructionString = `B ^= ${literalOperand}`;
              break;
            case 2: // bst
              registerB = comboOperand % 8n;
              instructionString = `B = ${comboOperandString} % 8`;
              break;
            case 3: // jnz
              instructionPointer = registerA == 0n ? instructionPointer + 2 : Number(literalOperand);
              instructionString = registerA == 0n ? "No jump" : `Jump to ${literalOperand}`;
              break;
            case 4: // bxc
              registerB ^= registerC;
              instructionString = "B ^= C";
              break;
            case 5: // out
              output.push(comboOperand % 8n);
              instructionString = `Output ${comboOperandString} % 8`;
              break;
            case 6: // bdv
              registerB = registerA >> comboOperand;
              instructionString = `B = A >> ${comboOperandString}`;
              break;
            case 7: // cdv
              registerC = registerA >> comboOperand;
              instructionString = `C = A >> ${comboOperandString}`;
              break;
          }
  
          if (instruction != 3)
            instructionPointer += 2;

          if (visualization) {
            visConsole.addLine(instructionString);
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
            visConsole.addLine(`A = ${registerA}`);
            visConsole.addLine(`B = ${registerB}`);
            visConsole.addLine(`C = ${registerC}`);
            visConsole.addLine(`Output: ${output.join(",")}`);
            visConsole.addLine();
          }
        }
  
        return output.join(",");
      }

      // Calculates the required value of register A so that the program outputs itself (part 2)
      else {
        if (program[program.length - 2] != 3 || program[program.length - 1] != 0)
          throw new Error("Solution for part 2 requires the last instruction to be 3,0");

        let aBitShift = BigInt(0);
        for (let i = 0; i < program.length; i += 2) {
          if (program[i] == 0) {
            if (program[i + 1] > 3)
              throw new Error("Solution for part 2 does not support combo operands for adv instruction");
            aBitShift += BigInt(program[i + 1]);
          }

          if (program[i] == 3 && i != program.length - 2)
            throw new Error("Solution for part 2 does not support jnz instruction in the middle of the program");
        }

        let registerAValues = [BigInt(0)];
        let output = program.slice().reverse();
        
        // Cycle the required output backwards
        for (let outputIndex = 0; outputIndex < output.length; outputIndex++) {
          if (this.isStopping)
            return;
  
          // Find all possible values of register A
          let newRegisterAValues = [];
          for (let registerA of registerAValues) {
            for (let i = 0n; i < (1n << aBitShift); i++)
            newRegisterAValues.push((registerA << aBitShift) + i)
          }
          registerAValues = newRegisterAValues;

          newRegisterAValues = [];
          for (let registerA of registerAValues) {
            let initialRegisterAValue = registerA;
            let registerBIsAssigned = false, registerCIsAssigned = false;
            
          // Add only those values of register A that produce the required output
          for (let instructionPointer = 0; instructionPointer < program.length; instructionPointer += 2) {
              let instruction = program[instructionPointer];
              let literalOperand = BigInt(program[instructionPointer + 1]);
              if (instruction > 7 || literalOperand > 7n || (instruction == 3 && literalOperand % 2n != 0))
                throw new Error(`Invalid instruction ${instruction},${literalOperand})`);
      
              let comboOperand = literalOperand;
              if (([0, 2, 5, 6, 7].indexOf(instruction) >= 0 && literalOperand == 5 && !registerBIsAssigned) || instruction == 4 && !registerBIsAssigned)
                  throw new Error(`Solution for part 2 does not support using B register as an operand before it is assigned in current program cycle`)
              if (([0, 2, 5, 6, 7].indexOf(instruction) >= 0 && literalOperand == 6 && !registerCIsAssigned) || instruction == 4 && !registerCIsAssigned)
                throw new Error(`Solution for part 2 does not support using C register as an operand before it is assigned in current program cycle`)

              if (literalOperand == 4)
                comboOperand = registerA;
              if (literalOperand == 5)
                comboOperand = registerB;
              if (literalOperand == 6)
                comboOperand = registerC;
              
              switch (instruction) {
                case 0: // adv
                  registerA >>= comboOperand;
                  break;
                case 1: // bxl
                  registerB ^= literalOperand;
                  registerBIsAssigned = true;
                  break;
                case 2: // bst
                  registerB = comboOperand % 8n;
                  registerBIsAssigned = true;
                  break;
                case 4: // bxc
                  registerB ^= registerC;
                  registerBIsAssigned = true;
                  break;
                case 5: // out
                  if (comboOperand % 8n == output[outputIndex])
                    newRegisterAValues.push(initialRegisterAValue);
                  break;
                case 6: // bdv
                  registerB = registerA >> comboOperand;
                  registerBIsAssigned = true;
                  break;
                case 7: // cdv
                  registerC = registerA >> comboOperand;
                  registerCIsAssigned = true;
                  break;
              }
            }
          }
          registerAValues = newRegisterAValues

          if (visualization) {
            visConsole.addLine(`Program cycle ${output.length - outputIndex} possible initial A values:`);
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
            visConsole.addLine(registerAValues.join("\n"));
            visConsole.addLine();
          }
        }

        if (registerAValues.length == 0)
          throw new Error("Solution not found")

        return registerAValues.reduce((acc, e) => e < acc ? e : acc);
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