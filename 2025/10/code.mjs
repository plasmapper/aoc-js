import { delay, Console, Range } from "../../utility.mjs";

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
    * @returns {Machine[]} Machines.
    */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let machines = input.trim().split(/\r?\n/).map((line, index) => {
      if (!/^\[[\.#]+\]( \([\d\,]+\))+ {([\d\,]+)}$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      let lineBlocks = line.split(" ");
      let numberOfLamps = lineBlocks[0].length - 2;
      let requiredLampState = lineBlocks[0].split("").slice(1, -1).reverse().reduce((acc, e) => (acc << 1) + (e == "#" ? 1 : 0), 0);
      let buttons = lineBlocks.slice(1, -1).map(button => button.substring(1, button.length - 1).split(",").map(e => {
        e = parseInt(e);
        if (e >= numberOfLamps)
          throw new Error(`Invalid data in line ${index + 1}`);
        return e;
      }));
      let joltages = lineBlocks[lineBlocks.length - 1].substring(1, lineBlocks[lineBlocks.length - 1].length - 1).split(",").map(e => parseInt(e));

      return new Machine(numberOfLamps, requiredLampState, buttons, joltages);
    });

    consoleLine.innerHTML += " done.";
    return machines;
  }

  /**
   * Finds the fewest button presses required to correctly configure the indicator lights on all of the machines.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Fewest button presses required to correctly configure the indicator lights on all of the machines.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let machines = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let totalMinNumberOfButtonPresses = 0;

      if (part == 1) {
        for (let machine of machines) {
          let numberOfButtonCombinations = Math.pow(2, machine.buttons.length);
          let minNumberOfButtonPresses = Number.MAX_SAFE_INTEGER;
          let minNumberOfPressesButtonCombination;
          // Test all combinations of button presses to check which one from those that achieve the required lamp state require less buttons to press
          for (let buttonCombination = 0; buttonCombination < numberOfButtonCombinations; buttonCombination++) {
            let state = 0;
            let numberOfButtonPresses = 0;
            for (let buttonIndex = 0; buttonIndex < machine.buttons.length; buttonIndex++) {
              if ((1 << buttonIndex) & buttonCombination) {
                state ^= machine.buttonsAsNumbers[buttonIndex];
                numberOfButtonPresses++;
              }
            }
            if (state == machine.requiredLampState && numberOfButtonPresses < minNumberOfButtonPresses) {
              minNumberOfButtonPresses = numberOfButtonPresses;
              minNumberOfPressesButtonCombination = buttonCombination;
            }
          }

          if (minNumberOfButtonPresses == Number.MAX_SAFE_INTEGER)
            throw new Error("Solution not found");

          totalMinNumberOfButtonPresses += minNumberOfButtonPresses;

          if (visualization) {
            visConsole.addLine(`[${new Array(machine.numberOfLamps).fill(0).map((e, i) => ((1 << i) & machine.requiredLampState) ? "#" : ".").join("")}]`);
            for (let buttonIndex = 0; buttonIndex < machine.buttons.length; buttonIndex++) {
              if ((1 << buttonIndex) & minNumberOfPressesButtonCombination)
                visConsole.addLine(`(${new Array(machine.numberOfLamps).fill(0).map((e, i) => machine.buttons[buttonIndex].indexOf(i) >= 0 ? i : " ").join("")})`);
            }
            visConsole.addLine(`<span class="highlighted">${minNumberOfButtonPresses}</span> button press${minNumberOfButtonPresses == 1 ? "" : "es"}.`);
            visConsole.addLine();
          }
        }
      }
      else {
        for (let machine of machines) {
          let system = machine.buttonJoltageLinearSystem;
          
          // Variables: number of button presses
          // Calculate the max values of variables
          let variableRanges = machine.buttons.map(e => new Range(0, Number.MAX_SAFE_INTEGER));
          for (let equation of system) {
            for (let i = 0; i < variableRanges.length; i++) {
              if (equation.coefficients[i] != 0)
                variableRanges[i].to = Math.min(variableRanges[i].to, equation.result);
            }
          }
          // Create the variable sum equation
          let variableSumExpression = new Substitution(-1, machine.buttons.map(e => 1), 0);

          let substitutions = [];

          // Find variable substitutions until the system has no more equations
          while (system.length > 0) {
            // Substitution variable is the first variable with a non-zero coefficient in the first equation
            let substitutionVariableIndex = system[0].coefficients.findIndex(e => e != 0);
            // Calculate substitution coefficients and the free term
            let substitution = new Substitution(substitutionVariableIndex,
              system[0].coefficients.map((e, i)=> i == substitutionVariableIndex ? 0 : -e / system[0].coefficients[substitutionVariableIndex]),
              system[0].result / system[0].coefficients[substitutionVariableIndex]);
            substitutions.push(substitution);

            // Substitute the variable into the remaining equations
            for (let i = 1; i < system.length; i++) {
              if (system[i].coefficients[substitutionVariableIndex] != 0) {
                system[i].coefficients = system[i].coefficients.map((e, j) => e + substitution.coefficients[j] * system[i].coefficients[substitutionVariableIndex]);
                system[i].result -= substitution.freeTerm * system[i].coefficients[substitutionVariableIndex];
                system[i].coefficients[substitutionVariableIndex] = 0;
              }
            }

            // Substitute the variable into the variable sum expression
            if (variableSumExpression.coefficients[substitutionVariableIndex] != 0) {
              variableSumExpression.coefficients = variableSumExpression.coefficients.map((e, j) => e + substitution.coefficients[j] * variableSumExpression.coefficients[substitutionVariableIndex]);
              variableSumExpression.freeTerm += substitution.freeTerm * variableSumExpression.coefficients[substitutionVariableIndex];
              variableSumExpression.coefficients[substitutionVariableIndex] = 0;
            }

            // Remove the zero equations from the system
            // If the equation coefficients are equal to zero and the result is not equal to zero - throw an exception
            system = system.filter((equation, i) => {
              if (i == 0)
                return false;
              if (equation.coefficients.every(e => Math.abs(e) < 1e-10)) {
                if (Math.abs(equation.result) < 1e-10)
                  return false;
                else {
                  throw new Error("Solution not found");
                }
              }
              return true;
            });
          }

          substitutions.reverse();

          // Create initial variable combination from the variables that have substitutions with only a free term
          let variableCombinations = [machine.buttons.map(e => 0)];
          for (let substitution of substitutions) {
            if (substitution.coefficients.every(e => Math.abs(e) < 1e-10))
              variableCombinations[0][substitution.variableIndex] = substitution.freeTerm;
          }

          // Create all possible variable combinations (for variables that do not have substitution expressions)
          for (let i = 0; i < machine.buttons.length; i++) {
            if (substitutions.find(e => e.variableIndex == i) == undefined) {
              let currentNumberOfVariableCombinations = variableCombinations.length;
              for (let j = 0; j < currentNumberOfVariableCombinations; j++) {
                for (let k = 1; k <= variableRanges[i].to; k++) {
                  let newVariableCombination = variableCombinations[j].slice();
                  newVariableCombination[i] = k;
                  variableCombinations.push(newVariableCombination);
                }
              }                
            }                        
          }

          let minVariableSum = Number.MAX_SAFE_INTEGER;
          let minSumVariableCombination;

          // For all possible variable combinations find the min variable sum so that all variables are positive and integer
          for (let variableCombination of variableCombinations) {
            for (let substitution of substitutions)
              variableCombination[substitution.variableIndex] = substitution.freeTerm + variableCombination.reduce((acc, e, i) => acc + e * substitution.coefficients[i], 0);
            let variableSum = variableSumExpression.freeTerm + variableCombination.reduce((acc, e, i) => acc + e * variableSumExpression.coefficients[i], 0);
            if (variableCombination.every(e => Math.abs(e - Math.round(e)) < 1e-10 && e > -1e-10) && variableSum > -1e-10 && variableSum < minVariableSum) {
              minSumVariableCombination = variableCombination;
              minVariableSum = Math.min(minVariableSum, variableSum);
            }
          }

          if (minVariableSum == Number.MAX_SAFE_INGER)
            throw new Error("Solution not found");

          totalMinNumberOfButtonPresses += minVariableSum;

          if (visualization) {
            visConsole.addLine(`{${machine.joltages.map(e => e.toString().padStart(3, " ")).join(",")}}`);
            for (let variableIndex = 0; variableIndex < minSumVariableCombination.length; variableIndex++) {
              if (minSumVariableCombination[variableIndex] != 0)
                visConsole.addLine(`(${new Array(machine.joltages.length).fill(0).map((e, i) => machine.buttons[variableIndex].indexOf(i) >= 0 ? i.toString().padStart(3, " ") : "   ").join(",")}) x ${minSumVariableCombination[variableIndex]}`);
            }
            visConsole.addLine(`<span class="highlighted">${minVariableSum}</span> button press${minVariableSum == 1 ? "" : "es"}.`);
            visConsole.addLine();
          }
        }
      }

      return totalMinNumberOfButtonPresses;
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
 * Puzzle machine class.
 */
class Machine {
  /**
   * @param {number} numberOfLamps Number of lamps.
   * @param {number} requiredrequiredLampStateState Required lamp state (bits represent lamps).
   * @param {number[][]} buttons Buttons (bits represent lamps that are toggled or joltage counters that are increased).
   * @param {number[]} joltages Joltages.
   */
  constructor(numberOfLamps, requiredLampState, buttons, joltages) {
    /**
     * Number of lamps.
     * @type {number}
     */
    this.numberOfLamps = numberOfLamps;
    /**
     * Required lamp state (bits represent lamps).
     * @type {number}
     */
    this.requiredLampState = requiredLampState;
    /**
     * Buttons as arrays of indexes of connected lamps or joltage counters.
     * @type {number[][]}
     */
    this.buttons = buttons;
    /**
     * Buttons as numbers (bits represent lamps that are toggled or joltage counters that are increased).
     * @type {number[][]}
     */
    this.buttonsAsNumbers = buttons.map(button => button.reduce((acc, e) => acc + (1 << e), 0));
    /**
     * Joltages.
     * @type {number[]}
     */
    this.joltages = joltages;
    /**
     * Buttons and joltage levels as a linear system matrix.
     * For example if buttons are (0), (1), (0) and joltage counters are {3,5}, the system is the following:
     * N0 + N2 = 3
     * N1 = 5
     * @type {Equation[]}
     */
    this.buttonJoltageLinearSystem = joltages.map((joltage, joltageIndex) => new Equation(buttons.map(button => button.indexOf(joltageIndex) >= 0 ? 1 : 0), joltage));
  }
}

/**
 * Puzzle equation class (represents an equation k1 * x1 + k2 * x2 + ... + kn * xn = result).
 */
class Equation {
  /**
   * @param {number[]} coefficients Coefficients.
   * @param {number} result Result.
   */
  constructor(coefficients, result) {
    /**
     * Coefficients.
     * @type {number[]}
     */
    this.coefficients = coefficients;
    /**
     * Result.
     * @type {number}
     */
    this.result = result;
  }
}

/**
 * Puzzle substitution class (represents a substitution xi = k1 * x1 + k2 * x2 + ... + kn * xn + freeTerm).
 */
class Substitution {
  /**
   * @param {number} variableIndex Variable index.
   * @param {number[]} coefficients Coefficients.
   * @param {number} freeTerm Free term.
   */
  constructor(variableIndex, coefficients, freeTerm) {
    /**
     * Variable index.
     * @type {number}
     */
    this.variableIndex = variableIndex;
    /**
     * Coefficients.
     * @type {number[]}
     */
    this.coefficients = coefficients;
    /**
     * Free term.
     * @type {number}
     */
    this.freeTerm = freeTerm;
  }
}