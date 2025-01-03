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
   * @returns {Monkey[]} Monkeys.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let monkeys = [];
    input.trim().split(/\r?\n/).forEach((line, lineIndex) => {
      let match;
      if ((match = line.match(/^([a-z]{4}): .+$/)) != null) {
        let monkey = monkeys.find(m => m.name == match[1]);
        if (monkey == undefined)
          monkeys.push(monkey = new Monkey(match[1]));
        
        if ((match = line.match(/^[a-z]{4}: (\d+)$/)) != null)
          monkey.number = parseInt(match[1]);
        else if ((match = line.match(/^[a-z]{4}: ([a-z]{4}) ([\+\-\*\/]) ([a-z]{4})$/)) != null) {
          monkey.operand1 = monkeys.find(m => m.name == match[1]);
          if (monkey.operand1 == undefined)
            monkeys.push(monkey.operand1 = new Monkey(match[1]));
          monkey.operand2 = monkeys.find(m => m.name == match[3]);
          if (monkey.operand2 == undefined)
            monkeys.push(monkey.operand2 = new Monkey(match[3]));
          monkey.operator = match[2];
          monkey.operand1.parent = monkey;
          monkey.operand2.parent = monkey;
        }
        else
          throw new Error(`Invalid data in line ${lineIndex + 1}`);
      }
    });
    
    consoleLine.innerHTML += " done.";
    return monkeys;
  }

  /**
   * Finds the root number (part 1) or the humn number (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The root number (part 1) or the humn number (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let monkeys = this.parse(input);
      let root = monkeys.find(m => m.name == "root");
      let humn = monkeys.find(m => m.name == "humn");

      if (part == 2)
        humn.number = null;

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let operationStrings = part == 1 ? root.calculate() : humn.inverseCalculate();
      if (visualization) {
        for (let operationString of operationStrings)
          visConsole.addLine(operationString);
        visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
        if (part == 2)
          visConsole.lines.find(line => line.innerHTML.includes("root")).classList.add("highlighted");
      }

      return part == 1 ? root.number : humn.number;
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
 * Puzzle monkey class.
 */
class Monkey {
  /**
   * @param {string} name Name.
   */
  constructor(name) {
    /**
     * Name.
     * @type {string}
     */    
    this.name = name;
    /**
     * Number.
     * @type {number}
     */    
    this.number = null;
    /**
     * Operand 1.
     * @type {Monkey}
     */
    this.operand1 = null;
    /**
     * Operand 2.
     * @type {Monkey}
     */
    this.operand2 = null;
    /**
     * Operator.
     * @type {string}
     */
    this.operator = null;
    /**
     * Parent.
     * @type {parent}
     */
    this.parent = null;
  }

  /**
   * Calculates the monkey number.
   * @returns {string[]} Operation strings.
   */
  calculate() {
    let operationStrings = [];

    if (this.number == null) {
      if (this.operand1 == null || this.operand2 == null || this.operator == null)
        throw new Error(`Monkey ${this.name} number can not be calculated`)

      operationStrings.push(...this.operand1.calculate());
      operationStrings.push(...this.operand2.calculate());

      if (this.operator == "+")
        this.number = this.operand1.number + this.operand2.number;
      if (this.operator == "-")
        this.number = this.operand1.number - this.operand2.number;
      if (this.operator == "*")
        this.number = this.operand1.number * this.operand2.number;
      if (this.operator == "/")
        this.number = this.operand1.number / this.operand2.number;
      operationStrings.push(`${this.name} = ${this.operand1.name} ${this.operator} ${this.operand2.name} = ${this.number}`);
    }
    else
      operationStrings.push(`${this.name} = ${this.number}`)

    return operationStrings;
  }

  /**
   * Calculates the monkey number from the parent number.
   * @returns {string[]} Operation strings.
   */
  inverseCalculate() {
    let operationStrings = [];

    if (this.number == null) {
      if (this.parent == null || this.parent.operand1 == null || this.parent.operand2 == null || this.parent.operator == null)
        throw new Error(`Monkey ${this.name} number can not be calculated`);

      let sibling = this == this.parent.operand1 ? this.parent.operand2 : this.parent.operand1;
      let thisIsLeftOperand = this == this.parent.operand1;

      if (this.parent.name != "root")
        operationStrings.push(...this.parent.inverseCalculate());
      operationStrings.push(...sibling.calculate());

      if (this.parent.name == "root") {
        this.number = sibling.number;
        operationStrings.push(`${this.name} = ${sibling.name} = ${this.number} (root = true)`);
      }
      else {
        if (this.parent.operator == "+") {
          this.number = this.parent.number - sibling.number;
          operationStrings.push(`${this.name} = ${this.parent.name} - ${sibling.name} = ${this.number}`)
        }
        if (this.parent.operator == "-") {
          if (thisIsLeftOperand) {
            this.number = this.parent.number + sibling.number;
            operationStrings.push(`${this.name} = ${this.parent.name} + ${sibling.name} = ${this.number}`)
          }
          else {
            this.number = sibling.number - this.parent.number;
            operationStrings.push(`${this.name} = ${sibling.name} - ${this.parent.name} = ${this.number}`)
          }
        }
        if (this.parent.operator == "*") {
          this.number = this.parent.number / sibling.number;
          operationStrings.push(`${this.name} = ${this.parent.name} / ${sibling.name} = ${this.number}`)
        }
        if (this.parent.operator == "/") {
          if (thisIsLeftOperand) {
            this.number = this.parent.number * sibling.number;
            operationStrings.push(`${this.name} = ${this.parent.name} * ${sibling.name} = ${this.number}`)
          }
          else {
            this.number = sibling.number / this.parent.number;
            operationStrings.push(`${this.name} = ${sibling.name} / ${this.parent.name} = ${this.number}`)
          }
        }
      }
    }
    else
      operationStrings.push(`${this.name} = ${this.number}`)

    return operationStrings;
  }
}