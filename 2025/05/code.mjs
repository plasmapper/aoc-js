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
    * @returns {{
    * freshIngredientIdRanges: Range[],
    * ingredientIds: number[]
    * }} Fresh ingredient ID ranges and ingredient IDs.
    */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let blocks = input.trim().split(/\r?\n\r?\n/);
    if (blocks.length != 2)
      throw new Error("Input structure is not valid");

    let freshIngredientIdRanges = blocks[0].split(/\r?\n/).map((line, index) => {
      let match = line.match(/^(\d+)-(\d+)$/);
      if (match == null || parseInt(match[1]) > parseInt(match[2]))
        throw new Error(`Invalid data in block 1 line ${index + 1}`);
      return new Range(parseInt(match[1]), parseInt(match[2]));
    });

    let ingredientIds = blocks[1].split(/\r?\n/).map((line, index) => {
      if (!/^\d+$/.test(line))
        throw new Error(`Invalid data in block 1 line ${index + 1}`);
      return parseInt(line);
    });

    consoleLine.innerHTML += " done.";
    return {freshIngredientIdRanges, ingredientIds};
  }

  /**
   * Finds the number of fresh ingredient IDs (part 1) or the max possible number of fresh ingredient IDs (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of fresh ingredient IDs (part 1) or the max possible number of fresh ingredient IDs (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {freshIngredientIdRanges, ingredientIds} = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Combine fresh ingredient ID ranges
      freshIngredientIdRanges = Range.combine(freshIngredientIdRanges);

      if (part == 1) {
        let numberOfFreshIngredientIds = 0;
        for (let id of ingredientIds) {
          let ingredientIsFresh = freshIngredientIdRanges.some(e => e.contains(id));
          if (ingredientIsFresh)
            numberOfFreshIngredientIds++;
          if (visualization) {
            visConsole.addLine(id);
            if (ingredientIsFresh)
              visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          }
        }

        return numberOfFreshIngredientIds;
      }
      else {
        let maxPossibleNumberOfFreshIngredientIds = freshIngredientIdRanges.reduce((acc, e) => acc + e.to - e.from + 1, 0);
        if (visualization) {
          visConsole.addLine(`Combined fresh ingredient ID ranges\n(contain <span class="highlighted">${maxPossibleNumberOfFreshIngredientIds}</span> ingredient IDs):`);
          for (let range of freshIngredientIdRanges)
            visConsole.addLine(`${range.from}-${range.to}`);
        }

        return maxPossibleNumberOfFreshIngredientIds;
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