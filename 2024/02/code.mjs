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

      let solConsole = this.solConsole;
      let visConsole = new Console();

      solConsole.addLine(`Number of reports: ${reports.length}.`);
      let solConsoleLine = solConsole.addLine();
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
        if (!reportIsSafe && part == 2) {
          for (let removedLevelIndex = 0; removedLevelIndex < report.length && !reportIsSafe; removedLevelIndex++) {
            reportIsSafe = this.checkReportSafety(report.slice(0, removedLevelIndex).concat(report.slice(removedLevelIndex + 1)));
          }
        }

        if (visualization) {
          let visConsoleLine = visConsole.addLine();
          visConsoleLine.innerHTML = `${report.join(" ")}`;
          if (reportIsSafe)
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          visConsole.container.scrollTop = visConsole.lines[reportIndex].offsetTop - visConsole.container.offsetHeight / 2;
          await delay(1);
        }

        if (reportIsSafe)
          numberOfSafeReports++;

        solConsoleLine.innerHTML = `Report ${reportIndex + 1} is ${reportIsSafe ? "safe" : "not safe"}.\nNumber of safe reports: ${numberOfSafeReports}.`;
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