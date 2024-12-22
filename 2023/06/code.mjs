import { delay, Console, Chart, ChartDataSet, Vector2D } from "../../utility.mjs";

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
   * @returns {Race[]} Races.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let races = [];

    let lines = input.trim().split(/\r?\n/);
    if (lines.length != 2)
      throw new Error(`Invalid number of data lines`);
    
    let match = lines[0].replaceAll(/\s+/g, " ").match(/^Time: ([ \d]+)$/);
    if (match == null)
      throw new Error(`Invalid data in line 1`);
    let times = match[1].split(" ").map(e => parseInt(e));
      
    match = lines[1].replaceAll(/\s+/g, " ").match(/^Distance: ([ \d]+)$/);
    if (match == null)
      throw new Error(`Invalid data in line 2`);

    let distances = match[1].split(" ").map(e => parseInt(e));
    if (distances.length != times.length)
      throw new Error(`Invalid data in line 2`);
    
    for (let i = 0; i < times.length; i++)
      races.push(new Race(times[i], distances[i]));

    consoleLine.innerHTML += " done.";
    return races;
  }

  /**
   * Calculates the multiplication product of numbers of ways to beat the record in races.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Multiplication product of numbers of ways to beat the record in races.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let races = this.parse(input);

      // Make a single race (part 2)
      if (part == 2) {
        let race = new Race(parseInt(races.reduce((acc, e) => acc + e.time, "")), parseInt(races.reduce((acc, e) => acc + e.recordDistance, "")));
        races = [race];
      }

      let solConsole = this.solConsole;
      solConsole.addLine(`Number of races: ${races.length}.`);
      let solConsoleLine = solConsole.addLine();

      let chart = new Chart("line", []);
      if (visualization) {
        this.visContainer.append(chart.container);
        chart.axes.x.label = "start time, ms";
        chart.axes.x.autoscale = false;
        chart.axes.y.label = "distance, mm";
        chart.datasets.push(new ChartDataSet(), new ChartDataSet());
        chart.datasets[1].pointStrokeColor = chart.datasets[1].pointFillColor = "#ffff00";
        chart.initialize();
      }

      let numbersOfWaysToBeatTheRecord = [];

      for (let [raceIndex, race] of races.entries()) {
        if (this.isStopping)
          return;

        // s = t * (T - t), s - distance, t - time to hold the button, T - race time
        // s should be more than S (record distance)
        // t * t - T * t + S < 0
        // t should be between t1 = (T - sqrt(D)) / 2 and t1 = (T + sqrt(D)) / 2, D = T * T - 4 * S
        
        let T = race.time, S = race.recordDistance, D = T * T - 4 * S;
        if (D < 0)
          throw new Error(`Race ${raceIndex + 1} record can not be broken`);

        let t1 = (T - Math.sqrt(D)) / 2, t2 = (T + Math.sqrt(D)) / 2;
        t1 = Number.isInteger(t1) ? t1 + 1 : Math.ceil(t1);
        t2 = Number.isInteger(t2) ? t2 - 1 : Math.floor(t2);

        numbersOfWaysToBeatTheRecord.push(Math.max(0, t2 - t1 + 1));

        solConsoleLine.innerHTML = `Race ${raceIndex + 1}: ${numbersOfWaysToBeatTheRecord[numbersOfWaysToBeatTheRecord.length - 1]} ways to beat the record.`;

        if (visualization) {
          chart.datasets[0].points.length = 0;
          chart.datasets[1].points.length = 0;
          let xStep = Math.max(1, Math.floor(race.time / 1000));
          for (let x = 0; x <= race.time; x += xStep) {
            chart.datasets[x >= t1 && x <= t2 ? 1 : 0].points.push(new Vector2D(x, x * (race.time - x)));
          }
          chart.axes.x.range.from = 0;
          chart.axes.x.range.to = race.time;
          chart.update();
          await delay(500);
        }
      }

      return numbersOfWaysToBeatTheRecord.reduce((acc, e) => acc * e, 1);
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
 * Puzzle race class.
 */
class Race {
  /**
   * @param {number} seedRanges Race time.
   * @param {number} maps Race record distance.
   */
  constructor(time, recordDistance) {
    /**
     * Race time.
     * @type {number}
     */
    this.time = time;
    /**
     * Race record distance.
     * @type {number}
     */
    this.recordDistance = recordDistance;
  }
}
