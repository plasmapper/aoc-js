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
      if ((match = line.match(/^(snd) ([a-z]|-?\d+)$/)) != null)
        return new Instruction(match[1], [isNaN(match[2]) ? match[2] : parseInt(match[2])]);
      if ((match = line.match(/^(rcv) ([a-z])$/)) != null)
        return new Instruction(match[1], [isNaN(match[2]) ? match[2] : parseInt(match[2])]);
      if ((match = line.match(/^(set|add|mul|mod) ([a-z]) ([a-z]|-?\d+)$/)) != null)
        return new Instruction(match[1], [isNaN(match[2]) ? match[2] : parseInt(match[2]), isNaN(match[3]) ? match[3] : parseInt(match[3])]);
      if ((match = line.match(/^(jgz) ([a-z]|-?\d+) ([a-z]|-?\d+)$/)) != null)
        return new Instruction(match[1], [isNaN(match[2]) ? match[2] : parseInt(match[2]), isNaN(match[3]) ? match[3] : parseInt(match[3])]);
      else
        throw new Error(`Invalid instruction ${index + 1} (${line})`);
    });

    consoleLine.innerHTML += " done.";
    return instructions;
  }

  /**
   * Finds the value of the recovered frequency (part 1) or the number of times program 1 sends a value (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Value of the recovered frequency (part 1) or the number of times program 1 sends a value (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let instructions = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let registerNames = new Set();
      instructions.forEach(e => {
        if (typeof e.operands[0] == "string")
          registerNames.add(e.operands[0]);
        if (typeof e.operands[1] == "string")
          registerNames.add(e.operands[1]);
      });
      registerNames = [...registerNames].sort();
      let numberOfPrograms = part == 1 ? 1 : 2;
      let memory = [];
      let messageQueues = [];
      for (let p = 0; p < numberOfPrograms; p++) {
        memory.push({});
        registerNames.forEach(e => memory[p][e] = 0);
        memory[p]["p"] = p;
        messageQueues.push([]);
      }

      let soundFrequency;
      let numberOfMessages = messageQueues.map(e => 0);

      for (let i = new Array(numberOfPrograms).fill(0); ; i = i.map(e => e + 1)) {
        if (part == 1 && i[0] >= instructions.length)
          throw new Error("RCV instruction is not executed");
        if (part == 2 && i.every((e, p) => e >= instructions.length || (instructions[e].opcode == "rcv" && messageQueues[p].length == 0))) {
          if (visualization) {
            if (i[0] >= instructions.length)
              visConsole.addLine(`Program 0 has reached the end of the code.`);
            else
              visConsole.addLine(`Program 0 is in a deadlock on a RCV instruction.`);
            if (i[1] >= instructions.length)
              visConsole.addLine(`Program 1 has reached the end of the code.`);
            else
              visConsole.addLine(`Program 1 is in a deadlock on a RCV instruction.`);
            visConsole.addLine(`Program 1 has sent <span class="highlighted">${numberOfMessages[1]}</span> message${numberOfMessages[1] == 1 ? "" : "s"}.`);
          }
          return numberOfMessages[1];
        }

        for (let p = 0; p < numberOfPrograms; p++) {
          let opcode = instructions[i[p]].opcode, operands = instructions[i[p]].operands;
          let registers = memory[p];

          if (opcode == "snd") {
            if (part == 1)
              soundFrequency = typeof operands[0] == "number" ? operands[0] : registers[operands[0]];
            else {
              messageQueues[1 - p].push(typeof operands[0] == "number" ? operands[0] : registers[operands[0]]);
              numberOfMessages[p]++;
            }
          }
          else if (opcode == "set")
            registers[operands[0]] = (typeof operands[1] == "number" ? operands[1] : registers[operands[1]]);
          else if (opcode == "add")
            registers[operands[0]] += (typeof operands[1] == "number" ? operands[1] : registers[operands[1]]);
          else if (opcode == "mul")
            registers[operands[0]] *= (typeof operands[1] == "number" ? operands[1] : registers[operands[1]]);
          else if (opcode == "mod")
            registers[operands[0]] %= (typeof operands[1] == "number" ? operands[1] : registers[operands[1]]);
          else if (opcode == "rcv") {
            if (part == 1 && (typeof operands[0] == "number" ? operands[0] : registers[operands[0]]) != 0) {
              if (visualization)
                visConsole.addLine(`The first RCV instruction with a non-zero value is executed after a SND instruction with value <span class="highlighted">${soundFrequency}</span>.`);
              return soundFrequency;
            }
            if (part == 2) {
              if (messageQueues[p].length > 0)
                registers[operands[0]] = messageQueues[p].shift();
              else
                i[p]--;
            }
          }
          else if (opcode == "jgz" && (typeof operands[0] == "number" ? operands[0] : registers[operands[0]]) > 0)
            i[p] += (typeof operands[1] == "number" ? operands[1] : registers[operands[1]]) - 1;
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

/**
 * Puzzle instruction class.
 */
export class Instruction {
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