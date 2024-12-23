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
   * @returns {number[][]} Reports.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let reports = input.trim().split(/\r?\n/).map((line, index) => line.split(" ").map(level => {
      if (isNaN(level))
        throw new Error(`Invalid data in line ${index + 1}`);
      return parseInt(level);
    }));
    
    consoleLine.innerHTML += " done.";
    return reports;
  }

  /**
   * Calculates the number of safe reports.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of safe reports.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let reports = this.parse(input);

      let visConsole = new Console();

      let numberOfSafeReports = 0;

      if (visualization)
        this.visContainer.append(visConsole.container);

      for (let reportIndex = 0; reportIndex < reports.length; reportIndex++) {
        if (this.isStopping)
          return;

        let report = reports[reportIndex];

        // Check report safety without removing levels (part 1)
        let reportIsSafe = this.checkReportSafety(report);

        // Check report safety with removing levels (part 2)
        let removedLevelIndex = -1;
        if (!reportIsSafe && part == 2) {
          for (removedLevelIndex = 0; removedLevelIndex < report.length && !reportIsSafe; removedLevelIndex++)
            reportIsSafe = this.checkReportSafety(report.slice(0, removedLevelIndex).concat(report.slice(removedLevelIndex + 1)));
          removedLevelIndex--;
        }

        if (visualization) {
          let visConsoleLine = visConsole.addLine();

          let reportString;
          if (reportIsSafe && removedLevelIndex >= 0)
            reportString = report.map((e, index) => index == removedLevelIndex ? `<span class="strongly-highlighted">${e}</span>` : e).join(" ");
          else
            reportString = report.join(" ");
          visConsoleLine.innerHTML = reportString;
          if (reportIsSafe)
            visConsoleLine.classList.add("highlighted");
        }

        if (reportIsSafe)
          numberOfSafeReports++;
      }
        
      return numberOfSafeReports;
    }
    finally {
      this.isSolving = false;
    }
  }

  /**
   * Checks the report safety.
   * @param {number[]} report Report.
   * @returns {boolean} True if the report is safe.
   */
  checkReportSafety(report) {
    let levelDifferenceIsOk = true;
    let levelIsIncreasing = false;
    let levelIsDecreasing = false;
    for (let levelIndex = 1; levelIndex < report.length; levelIndex++) {
      let levelDifference = report[levelIndex] - report[levelIndex - 1];
      if (Math.abs(levelDifference) < 1 || Math.abs(levelDifference) > 3)
        levelDifferenceIsOk = false;
      if (levelDifference > 0)
        levelIsIncreasing = true;
      if (levelDifference < 0)
        levelIsDecreasing = true;
    }
    
    return levelDifferenceIsOk && (levelIsDecreasing ^ levelIsIncreasing);
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