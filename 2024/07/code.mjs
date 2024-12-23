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
   * @returns {Equation[]} Equations.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");
  
  let equations = [];

  input.trim().split(/\r?\n/).forEach((line, index) => {
    let result = 0;
    let numbers = [];
    let match;

    if ((match = line.match(/^(\d+):((?: \d+)+)$/)) == null)
      throw new Error(`Invalid data in line ${index + 1}`);
    result = parseInt(match[1]);

    for (let number of match[2].trim().split(" ")) {
      if (isNaN(number))
        throw new Error(`Invalid data in line ${index + 1}`);
      numbers.push(parseInt(number));
    }

    equations.push(new Equation(result, numbers));
  });

  consoleLine.innerHTML += " done.";
  return equations;
}

  /**
   * Calculates the total calibration result.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Total calibration result.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let equations = this.parse(input);

      let visConsole = new Console();

      if (visualization)
        this.visContainer.append(visConsole.container);

      let totalResult = 0;

      if (visualization)
        this.visContainer.append(visConsole.container);

      for (let equationIndex = 0; equationIndex < equations.length; equationIndex++) {
        if (this.isStopping)
          return;

        let equation = equations[equationIndex];
        let operators = equation.findOperators(part == 1 ? 2 : 3);
        if (operators != null)
          totalResult += equation.result;

        if (visualization) {
          let visualizationString = "";
          if (operators != null) {
            visualizationString = `${equation.result} = ${equation.numbers[0]}`;
            for (let i = 1; i < equation.numbers.length; i++)
              visualizationString += ` ${operators[i - 1]} ${equation.numbers[i]}`;
          }
          else
            visualizationString = `${equation.result}: ${equation.numbers.join(" ")}`;

          let visConsoleLine = visConsole.addLine();
          visConsoleLine.innerHTML = visualizationString;
          if (operators != null)
            visConsoleLine.classList.add("highlighted");
        }
      }

      return totalResult;
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
 * Puzzle equation class.
 */
class Equation {
  /**
   * @param {number} result Result.
   * @param {number[]} numbers Numbers.
   */
  constructor(result, numbers) {
    /**
     * Result.
     * @type {number}
     */
    this.result = result;
    /**
     * Numbers.
     * @type {number[]}
     */
    this.numbers = numbers;
  }

  /**
   * Finds the operators that make the equation true.
   * @param {number} Number of operator types.
   * @returns {string[]} Operators.
   */
  findOperators(numberOfOperatorTypes) {
    let operators = [];

    // The first number is alread largeer than the result
    if (this.numbers[0] > this.result)
      return null;
    
    // The equation has only one number
    if (this.numbers.length == 1)
      return this.numbers[0] == this.result ? operators : null;

    // The apply an operator
    let addResult = this.numbers[0] + this.numbers[1];
    let mulResult = this.numbers[0] * this.numbers[1];
    let concatResult = parseInt("" + this.numbers[0] + this.numbers[1]);
    let numbers = this.numbers.slice(1);

    numbers[0] = addResult;
    if ((operators = new Equation(this.result, numbers).findOperators(numberOfOperatorTypes)) != null) {
      operators.unshift("+");
      return operators;
    }

    numbers[0] = mulResult;
    if ((operators = new Equation(this.result, numbers).findOperators(numberOfOperatorTypes)) != null) {
      operators.unshift("*");
      return operators;
    }

    if (numberOfOperatorTypes > 2) {
      numbers[0] = concatResult;
      if ((operators = new Equation(this.result, numbers).findOperators(numberOfOperatorTypes)) != null) {
        operators.unshift("||");
        return operators;
      }
    }

    return null;
  }
}