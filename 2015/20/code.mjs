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
   * @returns {number} Minimum number of presents.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    input = input.trim();
    if (!/^\d+$/.test(input)) 
      throw new Error("Input structure is not valid");

    consoleLine.innerHTML += " done.";
    return parseInt(input);
  }

  /**
   * Finds the minimum number of house that gets more than or equal to the specified number of presents.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Minimum number of house that gets more than or equal to the specified number of presents.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let minNumberOfPresents = this.parse(input);
      let presentsPerElf = part == 1 ? 10 : 11;

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      for (let houseNumber = 1; ; houseNumber++) {
        let factors = new Set();
        let minFactor = part == 1 ? 1 : Math.ceil(houseNumber / 50);
        let maxFactor = Math.floor(Math.sqrt(houseNumber))
        for (let factor = 1; factor <= maxFactor; factor++) {
          if (houseNumber % factor == 0) {
            if (factor >= minFactor)
              factors.add(factor);
            let complementaryFactor = houseNumber / factor; 
            if (complementaryFactor >= minFactor)
              factors.add(complementaryFactor);
          }
        }

        let numberOfPresents = [...factors].reduce((acc, e) => acc + e * presentsPerElf, 0);
        
        if (numberOfPresents >= minNumberOfPresents) {
          if (visualization)
            visConsole.addLine(`House ${houseNumber} got ${numberOfPresents} presents.`);
          return houseNumber;
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