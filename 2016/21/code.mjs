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
      if ((match = line.match(/^swap position (\d+) with position (\d+)$/)) != null)
        return new Instruction("swap position", [parseInt(match[1]), parseInt(match[2])]);
      else if ((match = line.match(/^swap letter ([a-z]) with letter ([a-z])$/)) != null)
        return new Instruction("swap letter", [match[1], match[2]]);
      else if ((match = line.match(/^rotate (left|right) (\d+) steps?$/)) != null)
        return new Instruction("rotate", [match[1], parseInt(match[2])]);
      else if ((match = line.match(/^rotate based on position of letter ([a-z])$/)) != null)
        return new Instruction("rotate", [match[1]]);
      else if ((match = line.match(/^reverse positions (\d+) through (\d+)$/)) != null)
        return new Instruction("reverse", [parseInt(match[1]), parseInt(match[2])]);
      else if ((match = line.match(/^move position (\d+) to position (\d+)$/)) != null)
        return new Instruction("move", [parseInt(match[1]), parseInt(match[2])]);
      else
        throw new Error(`Invalid instruction ${index + 1}`);
    });

    consoleLine.innerHTML += " done.";
    return instructions;
  }

  /**
   * Finds the scrambled password (part 1) or the un-scrambled version of the scrambled password (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string} Scrambled password (part 1) or the un-scrambled version of the scrambled password (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let instructions = this.parse(input);
      let strings = [(instructions.length < 10 ? (part == 1 ? "abcde" : "decab") : (part == 1 ? "abcdefgh" : "fbgdceah")).split("")];
      if (part == 2)
        instructions.reverse();

      let visConsole = new Console();
      if (visualization) {
        this.visContainer.append(visConsole.container);
        visConsole.addLine(`Initial string: ${strings[0].join("")}.`);
        visConsole.addLine();
      }

      for (let instruction of instructions) {
        let action = instruction.action;
        let param1 = instruction.parameters[0];
        let param2 = instruction.parameters[1];
        
        if (action == "swap position") {
          strings.forEach(string => [string[param1], string[param2]] = [string[param2], string[param1]]);
          if (visualization)
            visConsole.addLine(`Swap position ${param1} with position ${param2}:`)
        }
        else if (action == "swap letter") {
          strings.forEach(string => {
            let i1 = string.indexOf(param1), i2 = string.indexOf(param2);
            [string[i1], string[i2]] = [string[i2], string[i1]];
          });
          if (visualization)
            visConsole.addLine(`Swap letter ${param1} with letter ${param2}:`)
        }
        else if (instruction.action == "rotate") {
          let newStrings = [];

          for (let string of strings) {
            let shifts;

            if (param1 == "left" || param1 == "right")
              shifts = [param2 * (param1 == "left" ^ (part == 2) ? -1 : 1)];
            else {
              let possibleInitialIndexes = [];
              if (part == 2) {
                let finalIndex = string.indexOf(param1);
                for (let initialIndex = 0; initialIndex < string.length; initialIndex++) {
                  if ((2 * initialIndex + 1 + (initialIndex >= 4 ? 1 : 0)) % string.length == finalIndex)
                    possibleInitialIndexes.push(initialIndex);
                }
              }
              else
                possibleInitialIndexes = [string.indexOf(param1)];

              shifts = possibleInitialIndexes.map(index => (index + 1 + (index >= 4 ? 1 : 0)) * (part == 2 ? -1 : 1));
            }

            for (let shift of shifts) {
              shift = Math.sign(shift) * (Math.abs(shift) % string.length);
              if (shift >= 0)
                newStrings.push([...string.slice(string.length - shift), ...string.slice(0, string.length - shift)]);
              if (shift < 0)
                newStrings.push([...string.slice(-shift), ...string.slice(0, -shift)]);
            }
          }

          strings = newStrings;

          if (param1 == "left" || param1 == "right")
            visConsole.addLine(`Rotate ${param1 == "left" ^ part == 2 ? "left" : "right"} ${param2} step${param2 == 1 ? "" : "s"}:`);
          else  {
            if (part == 1)
              visConsole.addLine(`Rotate based on position of letter ${param1}:`);
            else
              visConsole.addLine(`Reverse rotation based on position of letter ${param1}:`);
          }
        }
        else if (instruction.action == "reverse") {
          strings = strings.map(string => [...string.slice(0, param1), ...string.slice(param1, param2 + 1).reverse(), ...string.slice(param2 + 1)]);
          if (visualization)
            visConsole.addLine(`Reverse positions ${param1} through ${param2}:`)
        }
        else if (instruction.action == "move") {
          strings.forEach(string => string.splice((part == 2 ? param1 : param2), 0, string.splice((part == 2 ? param2 : param1), 1)[0]));
          if (visualization)
            visConsole.addLine(`Move position ${param1} to position ${param2}:`)
        }

        if (part == 1)
          visConsole.addLine(`String: <span class="highlighted">${strings[0].join("")}</span>.`);
        else {
          if (strings.length == 0)
            visConsole.addLine("No possible strings.");
          else
            visConsole.addLine(`Possible string${strings.length == 1 ? "" : "s"}: ${strings.map(e => `<span class="highlighted">${e.join("")}</span>`).join(", ")}.`);
        }
        visConsole.addLine();

        if (strings.length == 0)
          throw new Error("Solution not found");
      }

      return strings[strings.length - 1].join("");
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
   * @param {string} action Action.
   * @param {number|string[]} parameters Parameters.
   */
  constructor(action, parameters) {
    /**
     * Action.
     * @type {string}
     */
    this.action = action;
    /**
     * Parameters.
     * @type {number|string[]}
     */
    this.parameters = parameters;
  }
}