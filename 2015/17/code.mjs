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
   * @returns {number[]} Container volumes.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let containerVolumes = input.trim().split(/\r?\n/).map((line, index) => {
      if (!/^\d+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return parseInt(line);
    });

    consoleLine.innerHTML += " done.";
    return containerVolumes;
  }

  /**
   * Finds the number of container combinations.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of container combinations.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let containerVolumes = this.parse(input);
      let totalVolume = containerVolumes.length < 10 ? 25 : 150;

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let resultCombinations = [];
      let combinations = containerVolumes.map((e, i) => [i]);

      while (combinations.length) {
        let combination = combinations.pop();

        for (let i = combination[combination.length - 1] + 1; i < containerVolumes.length; i++) {
          let combinationVolume = combination.reduce((acc, e) => acc + containerVolumes[e], 0);
          if (combinationVolume + containerVolumes[i] == totalVolume) {
            resultCombinations.push(combination.slice());
            resultCombinations[resultCombinations.length - 1].push(i);
          }
          if (combinationVolume + containerVolumes[i] < totalVolume) {
            combinations.push(combination.slice());
            combinations[combinations.length - 1].push(i);
          }
        }
      }

      if (part == 2) {
        let minCombinationSize = resultCombinations.reduce((acc, e) => Math.min(acc, e.length), Number.MAX_VALUE);
        if (visualization)
          visConsole.addLine(`Minimum number of containers: ${minCombinationSize}`);
        resultCombinations = resultCombinations.filter(e => e.length == minCombinationSize);
      }

      if (visualization) {
        for (let combination of resultCombinations)
          visConsole.addLine(`${totalVolume} = ${combination.map(e => containerVolumes[e]).join(" + ")}`);
      }

      return resultCombinations.length;
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