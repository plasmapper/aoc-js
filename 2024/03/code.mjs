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
   * @returns {string} Computer memory.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    return input;
  }

  /**
   * Calculates the sum of the multiplications.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of the multiplications.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let memory = this.parse(input);

      let visConsole = new Console();

      if (visualization)
        this.visContainer.append(visConsole.container);

      let operations = [];

      // Find all multiplications
      let regex = /mul\(\d+,\d+\)/g;
      let match;
      while(match = regex.exec(memory))
        operations.push(new Operation(match[0], match.index));

      if (part == 2) {
        // Find all dos
        regex = /do\(\)/g;
        while(match = regex.exec(memory))
          operations.push(new Operation(match[0], match.index));
  
        // Find all don'ts
        regex = /don't\(\)/g;
        while(match = regex.exec(memory))
          operations.push(new Operation(match[0], match.index));
      }

      // Sort operations by string index
      operations.sort((o1, o2) => o1.stringIndex - o2.stringIndex);

      let sum = 0;

      if (visualization)
        this.visContainer.append(visConsole.container);

      let multiplicationIsEnabled = true;
      for (let i = 0; i < operations.length; i++) {
        let operation = operations[i];
        if (this.isStopping)
          return;

        let product;
        if (operation.string == "do()")
          multiplicationIsEnabled = true;
        else if (operation.string == "don't()")
          multiplicationIsEnabled = false;
        else {
          if (multiplicationIsEnabled) {
            let factors = operation.string.match(/^mul\((\d+),(\d+)\)$/).slice(1).map(e => parseInt(e));
            product = factors[0] * factors[1]
            sum += product;
          }
        }

        if (visualization) {
          let beforeString = i == 0 ? memory.substring(0, operation.stringIndex) : memory.substring(operations[i - 1].stringIndex + operations[i - 1].string.length, operation.stringIndex);
          let operationString = memory.substring(operation.stringIndex, operation.stringIndex + operation.string.length);
          let afterString = i == operations.length - 1 ? memory.substring(operation.stringIndex + operation.string.length) : "";

          if (beforeString != "")
            visConsole.addLine().innerHTML = `<span>${beforeString}</span>`;
          if (operationString != "") {
            if (operationString == "do()" || operationString == "don't()")
              visConsole.addLine().innerHTML = `<span class="strongly-highlighted">${operationString}</span>`;
            else {
              if (multiplicationIsEnabled)
                operationString += ` = ${product}`;
              visConsole.addLine().innerHTML = `<span${multiplicationIsEnabled ? ` class="highlighted"` : ""}>${operationString}</span>`;
            }
          }
          if (afterString != "")
            visConsole.addLine().innerHTML = `<span>${afterString}</span>`;
        }
      }
        
      return sum;
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
 * Operation class.
 */
class Operation {
  /**
   * @param {string} string Operation string.
   * @param {number} stringIndex Operation string index.
   */
  constructor(string, stringIndex) {
    /**
     * Operation string.
     * @type {string}
     */
    this.string = string;
    /**
     * Operation string index.
     * @type {number}
     */
    this.stringIndex = stringIndex;
  }
}
