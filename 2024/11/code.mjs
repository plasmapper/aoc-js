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
   * @returns {Stone[]} Stones.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");
  
  let stones = [];

  input.trim().split(" ").forEach((number, index) => {
    if (isNaN(number))
      throw new Error(`Invalid number ${index + 1}`);
    stones.push(new Stone(parseInt(number)));
  });
  
  consoleLine.innerHTML += " done.";
  return stones;
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

      let initialStones = this.parse(input);
      let numberOfBlinks = part == 1 ? 25 : 75;
      
      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let knownStones = new Map();
      for (let stone of initialStones)
        knownStones.set(stone.number, stone);

      let stones = initialStones.slice();
      for (let blink = 1; blink <= numberOfBlinks && stones.length > 0; blink++) {
        let newStones = [];

        for (let stone of stones) {
          // Calculate child stone numbers
          let childStoneNumbers = [];
          if (stone.number == 0)
            childStoneNumbers.push(1);
          else {
            let stoneString = stone.number.toString();
            if (stoneString.length % 2 == 0)
              childStoneNumbers.push(parseInt(stoneString.substring(0, stoneString.length / 2)), parseInt(stoneString.substring(stoneString.length / 2)));
            else
            childStoneNumbers.push(stone.number * 2024);
          }

          for (let childStoneNumber of childStoneNumbers) {
            // Check if the child stone has already been encountered
            let childStone = knownStones.get(childStoneNumber);
            if (childStone == undefined) {
              childStone = new Stone(childStoneNumber);
              newStones.push(childStone);
              knownStones.set(childStoneNumber, childStone);
            }

            // Add child stone
            stone.children.push(childStone);
          }

          // Set blink result for 1 blink
          stone.blinkResults.push(stone.children.length)
        }

        stones = newStones;
      }

      if (visualization)
        visConsole.addLine(`After 1 blink: ${initialStones.reduce((acc, stone) => acc + stone.blinkResults[1], 0)} stones.`);

      // Calculate blink N result from blink N-1 results
      for (let blink = 2; blink <= numberOfBlinks; blink++) {
        knownStones.forEach(stone => stone.blinkResults.push(stone.children.reduce((acc, child) => acc + child.blinkResults[blink - 1], 0)));
        if (visualization)
          visConsole.addLine(`After ${blink} blinks: ${initialStones.reduce((acc, stone) => acc + stone.blinkResults[blink], 0)} stones.`);
      }

      return initialStones.reduce((acc, stone) => acc + stone.blinkResults[numberOfBlinks], 0);
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
 * Puzzle stone class.
 */
class Stone {
  /**
   * @param {number} number Stone number.
   */
  constructor(number) {
    /**
     * Stone number.
     * @type {number}
     */
    this.number = number;
    /**
     * Stone children.
     * @type {Parent[]}
     */
    this.children = [];
    /**
     * Number of stones after index number of blinks.
     * @type {number[]}
     */
    this.blinkResults = [ 1 ];
  }
}