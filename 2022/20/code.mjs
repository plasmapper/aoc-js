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
   * @returns {Number[]} Numbers.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let numbers = input.trim().split(/\r?\n/).map((line, lineIndex) => {
      let match;
      if ((match = line.match(/^-?\d+$/)) == null)
        throw new Error(`Invalid data in line ${lineIndex + 1}`);

      return new Number(parseInt(match[0]));
    });

    for (let i = 0; i < numbers.length; i++) {
      if (i > 0)
        numbers[i].previous = numbers[i - 1];
      else
        numbers[i].previous = numbers[numbers.length - 1];
      
      if (i < numbers.length - 1)
        numbers[i].next = numbers[i + 1];
      else
        numbers[i].next = numbers[0];
    }
    
    consoleLine.innerHTML += " done.";
    return numbers;
  }

  /**
   * Finds the sum of grove coordinates.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of grove coordinates.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let numbers = this.parse(input);
      let numberOfNumbers = numbers.length;
      let multiplier = part == 1 ? 1 : 811589153;
      let numberOfMixes = part == 1 ? 1 : 10;
      let zero = numbers.find(number => number.value == 0);
      if (zero == undefined)
        throw new Error("Zero not found");
      numbers.forEach(number => number.value *= multiplier);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Mix numbers
      for (let mix = 0; mix < numberOfMixes; mix++) {
        for (let number of numbers) {
          let shift = number.value % (numberOfNumbers - 1);
          if (shift < 0)
            shift += numberOfNumbers - 1;
          
          if (shift != 0) {
            let newPrevious = number;
            for (let i = 0; i < shift; i++, newPrevious = newPrevious.next);
  
            number.previous.next = number.next;
            number.next.previous = number.previous;
            number.previous = newPrevious;
            number.next = newPrevious.next;
            newPrevious.next.previous = number;
            newPrevious.next = number;
          }
        }
      }

      // Find coordinates
      let coordinates = [zero, zero, zero];
      for (let i = 0; i < 1000; i++, coordinates[0] = coordinates[0].next);
      for (let i = 0; i < 2000; i++, coordinates[1] = coordinates[1].next);
      for (let i = 0; i < 3000; i++, coordinates[2] = coordinates[2].next);

      if (visualization) {
        visConsole.addLine(`Decryption key: ${multiplier}.`)
        visConsole.addLine(`After ${numberOfMixes} round${numberOfMixes == 1 ? "" : "s"} of mixing:`)
        let numberValues = [];
        for (let i = 0, number = zero; i < numberOfNumbers; i++, number = number.next)
          numberValues.push(coordinates.includes(number) ? `<span class="highlighted">${number.value}</span>` : `${number.value}`);
        visConsole.addLine(numberValues.join(", "));
      }

      return coordinates.reduce((acc, e) => acc + e.value, 0);
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
 * Puzzle number class.
 */
class Number {
  /**
   * @param {number} value Value.
   */
  constructor(value) {
    /**
     * Value.
     * @type {number}
     */
    this.value = value;
    /**
     * Previous number.
     * @type {Number}
     */
    this.previous = null;
    /**
     * Next number.
     * @type {Number}
     */
    this.next = null;
  }
}