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
    * @returns {{
    * rules: number[][],
    * updates: number[][]
    * }} Rules and updates.
    */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let blocks = input.trim().split(/\r?\n\r?\n/);
    if (blocks.length != 2)
      throw new Error("Input structure is not valid");

    let rules = blocks[0].split(/\r?\n/).map((line, index) => {
      if (!/^\d+|\d+$/.test(line))
        throw new Error(`Invalid data in block 1 line ${index + 1}`);
      return line.split("|").map(e => parseInt(e));
    });
    
    let updates = blocks[1].split(/\r?\n/).map((line, index) => {
      let update = line.split(",").map(page => {
        if (!/^\d+$/.test(page))
          throw new Error(`Invalid data in block 2 line ${index + 1}`);
        return parseInt(page);
      });
      if (update.length % 2 != 1)
        throw new Error(`Invalid data in update ${index + 1} (number of pages must be odd)`);
      return update;
    });

    consoleLine.innerHTML += " done.";
    return {rules, updates};
  }

  /**
   * Calculates the sum of middle page numbers for correct (part 1) or corrected (part 2) updates.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of middle page numbers for correct (part 1) or corrected (part 2) updates.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {rules, updates} = this.parse(input);

      let visConsole = new Console();

      if (visualization)
        this.visContainer.append(visConsole.container);

      let sum = 0;

      if (visualization)
        this.visContainer.append(visConsole.container);

      for (let updateIndex = 0; updateIndex < updates.length; updateIndex++) {
        if (this.isStopping)
          return;

        let update = updates[updateIndex];

        // Find rules that apply to this update
        let appliedRules = rules.filter(rule => update.indexOf(rule[0]) >= 0 && update.indexOf(rule[1]) >= 0);

        // Check if the update is correct
        let updateIsCorrect = appliedRules.reduce((acc, rule) => {
          let pageIndexes = rule.map(page => update.indexOf(page));
          return acc && pageIndexes[0] < pageIndexes[1];
        }, true);
        let updateHasBeenCorrected = false;

        // Correct the update (part 2)
        if (!updateIsCorrect && part == 2) {
          let correctedUpdate = [];

          while (update.length) {
            // Find the page that is not the first page in any applied rule
            let pageIndex = update.findIndex(page => appliedRules.reduce((acc, rule) => acc && rule[0] != page, true));
            
            let page = update[pageIndex];

            // Place the page at the beginning of the corrected update
            correctedUpdate.unshift(page);
            // Remove the page from the original update
            update.splice(pageIndex, 1);
            // Remove the rules that contain this page
            appliedRules = appliedRules.filter(rule => rule[1] != page);
          }

          updateHasBeenCorrected = true;
          update = correctedUpdate;
        }

        if ((part == 1 && updateIsCorrect) || (part == 2 && updateHasBeenCorrected))
          sum += update[Math.floor(update.length / 2)];

        if (visualization) {
          visConsole.addLine().innerHTML = `Update ${updateIndex + 1}:`;
          if ((part == 1 && updateIsCorrect) || (part == 2 && updateHasBeenCorrected)) {
            visConsole.addLine().innerHTML = update.slice(0, Math.floor(update.length / 2)).join(",") + 
            `,<span class="highlighted">${update[Math.floor(update.length / 2)]}</span>,` + 
            update.slice(Math.ceil(update.length / 2)).join(",");
          }
          else
            visConsole.addLine().innerHTML = update.join(",");
          visConsole.addLine();
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