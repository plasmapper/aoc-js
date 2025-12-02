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
   * @returns {Range[]} Ranges.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let ranges = input.trim().split(",").map((line, index) => {
      let match = line.match(/^(\d+)\-(\d+)$/);
      if (match == null || parseInt(match[1]) > parseInt(match[2]))
        throw new Error(`Invalid range ${index + 1}`);
      return new Range(parseInt(match[1]), parseInt(match[2]));
    });
    
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        if (ranges[i].overlap(ranges[j])[1] != null)
          throw new Error("Ranges overlap")
      }
    }

    consoleLine.innerHTML += " done.";
    return ranges;
  }

  /**
   * Finds the sum of all the invalid IDs.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of all the invalid IDs.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let ranges = this.parse(input);
      
      let maxId = ranges.reduce((acc, e) => Math.max(acc, e.to), 0);
      let maxNumberOfDigits = maxId.toString().length;

      // Calculate possible invalid ID divisors for various number of digits
      let divisors = [[], []];
      for (let i = 2; i <= maxNumberOfDigits; i++) {
        divisors.push([]);
        for (let j = 1; j <= Math.floor(i / 2); j++) {
          if (i % j == 0) {
            let divisorString = "";
            for (let k = 0; k < i; k++)
              divisorString = (k % j == 0 ? "1" : "0") + divisorString;
            divisors[i].push(parseInt(divisorString));
          }
          else
            divisors[i].push(null);
        }
      }

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let sumOfInvalidIds = 0;

      for (let range of ranges) {
        let invalidIdSet = new Set();
        // For all possible number of digits
        for (let numberOfDigits = range.from.toString().length; numberOfDigits <= range.to.toString().length; numberOfDigits++) {
          if (part == 2 || numberOfDigits % 2 == 0) {
            // For all possible divisors
            for (let divisorIndex = part == 2 ? 0 : divisors[numberOfDigits].length - 1; divisorIndex < divisors[numberOfDigits].length; divisorIndex++) {
              let divisor = divisors[numberOfDigits][divisorIndex];
              if (divisor != null) {
                // Find all divisible IDs within the range
                let startMultiplier = Math.max(Math.ceil(range.from / divisor), Math.pow(10, divisorIndex));
                let endMultiplier = Math.min(Math.floor(range.to / divisor), Math.pow(10, divisorIndex + 1) - 1);
                for (let i = startMultiplier; i <= endMultiplier; i++) {
                  let id = i * divisor;
                  invalidIdSet.add(id);
                }
              }
            }
          }
        }

        let invalidIds = Array.from(invalidIdSet);
        sumOfInvalidIds += invalidIds.reduce((acc, e) => acc + e, 0);
        
        if (visualization) {
          visConsole.addLine(`${range.from}-${range.to} contains ${invalidIds.length == 0 ? "no invalid IDs" : "<span class='highlighted'>" + invalidIds.join(", ") + "</span>"}.`);
          visConsole.addLine();
        }
      }

      return sumOfInvalidIds;
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