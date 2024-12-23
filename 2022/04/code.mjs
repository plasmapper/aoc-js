import { delay, Console, Range } from "../../utility.mjs";

export default class {
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
   * @returns {Range[][]} Pairs of ranges.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let rangePairs = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match = line.match(/^(\d+)-(\d+),(\d+)-(\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      rangePairs.push ([new Range(parseInt(match[1]), parseInt(match[2])), new Range(parseInt(match[3]), parseInt(match[4]))]);
    });

    consoleLine.innerHTML += " done.";
    return rangePairs;
  }

  /**
   * Calculates the number of range overlaps.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of range overlaps.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;
      
      let rangePairs = this.parse(input);
      let fullyContain = part == 1;

      let visConsole = new Console();
      
      let overlaps = 0;
  
      if (visualization) {
        this.visContainer.append(visConsole.container);
  
        for (let pair of rangePairs)
          visConsole.addLine(`${pair[0].from}-${pair[0].to}, ${pair[1].from}-${pair[1].to}`);
      }
  
      for (let [pairIndex, pair] of rangePairs.entries()) {
        if (this.isStopping)
          return;
  
        let overlap = false;
        if (fullyContain)
          overlap = (pair[0].from <= pair[1].from && pair[0].to >= pair[1].to) || (pair[1].from <= pair[0].from && pair[1].to >= pair[0].to);
        else
          overlap = (pair[0].from <= pair[1].from && pair[0].to >= pair[1].from) || (pair[1].from <= pair[0].from && pair[1].to >= pair[0].from);
  
        if (overlap)
          overlaps++;
  
        if (visualization) {
          if (overlap)
            visConsole.lines[pairIndex].classList.add("highlighted");
        }
      }
      
      return overlaps;
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