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
   * @returns {RulesAnddUpdates} Rules and updates.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");
  
  let rules = [];
  let updates = [];
  let parsingRules = true;

  input.trim().split(/\r?\n/).forEach((line, index) => {
    line = line.trim();
    if (line == "") {
      parsingRules = false;
    }
    else {
      if (parsingRules) {
        if (!/^\d+|\d+$/.test(line))
          throw new Error(`Invalid data in line ${index + 1}`);
        rules.push(line.split("|").map(e => parseInt(e)));
      }
      else {
        let update = [];
        for (let page of line.split(",")) {
          if (isNaN(page))
            throw new Error(`Invalid data in line ${index + 1}`);
          update.push(parseInt(page));
        }
        if (update.length % 2 != 1)
          throw new Error(`Invalid data in line ${index + 1} (number of pages must be odd)`);
        updates.push(update);
      }
    }
  });

  consoleLine.innerHTML += " done.";
  return {rules: rules, updates: updates};
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

      let solConsole = this.solConsole;
      let visConsole = new Console();

      if (visualization)
        this.visContainer.append(visConsole.container);

      solConsole.addLine(`Number of updates: ${updates.length}.`);
      
      let solConsoleLine = solConsole.addLine();
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
          let correctedUpdate = new Array(update.length).fill(null);
          // Place the page in the corrected update according to the number of times it is the first page in the applied rules
          for (let pageIndex = 0; pageIndex < update.length; pageIndex++) {
            let newPageIndex = update.length - appliedRules.reduce((acc, rule) => rule[0] == update[pageIndex] ? acc + 1 : acc, 0) - 1;
            if (newPageIndex < 0 || newPageIndex >= update.length)
              throw new Error(`Update ${updateIndex + 1} can not be corrected`);
            correctedUpdate[newPageIndex] = update[pageIndex];
          }
          // Check the corrected update
          if (correctedUpdate.reduce((acc, page) => acc || page == null, false))
            throw new Error(`Update ${updateIndex + 1} can not be corrected`);
          updateHasBeenCorrected = true;
          update = correctedUpdate;
        }

        if ((part == 1 && updateIsCorrect) || (part == 2 && updateHasBeenCorrected))
          sum += update[Math.floor(update.length / 2)];

        solConsoleLine.innerHTML = `Update ${updateIndex + 1} ${updateIsCorrect ? "is correct" : (updateHasBeenCorrected ? "has been corrected" : "is not correct")}.\nSum of middle page numbers: ${sum}.`;

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

          visConsole.container.scrollTop = visConsole.lines[visConsole.lines.length - 1].offsetTop - visConsole.container.offsetHeight / 2;
          await delay(1);
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