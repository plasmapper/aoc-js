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
   * @returns {Reindeer[]} Reindeers.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let reindeers = input.trim().split(/\r?\n/).map((line, index) => {
      let match;
      if ((match = line.match(/^(.+) can fly (\d+) km\/s for (\d+) seconds, but then must rest for (\d+) seconds.$/)) == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return new Reindeer(match[1], parseInt(match[2]), parseInt(match[3]), parseInt(match[4]));
    });

    consoleLine.innerHTML += " done.";
    return reindeers;
  }

  /**
   * Finds the distance traveled by the winning reindeer (part 1) or the number of points of the winning reindeer (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Distance traveled by the winning reindeer (part 1) or the number of points of the winning reindeer (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let reindeers = this.parse(input);
      let time = reindeers.length < 5 ? 1000 : 2503;

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Find distances
      if (part == 1) {
        for (let reindeer of reindeers) {
          reindeer.distance += Math.floor(time / (reindeer.flyTime + reindeer.restTime)) * reindeer.speed * reindeer.flyTime;
          reindeer.distance += reindeer.speed * Math.min(time % (reindeer.flyTime + reindeer.restTime), reindeer.flyTime);
        }
      }
      // Find points
      else {
        for (let i = 0; i < time; i++) {
          for (let reindeer of reindeers) {
            if (i % (reindeer.flyTime + reindeer.restTime) < reindeer.flyTime)
              reindeer.distance += reindeer.speed;
          }

          let maxDistance = Math.max(...reindeers.map(e => e.distance));
          reindeers.forEach(reindeer => reindeer.points += reindeer.distance == maxDistance ? 1 : 0);
        }
      }

      let maxDistance = Math.max(...reindeers.map(e => e.distance));
      let maxPoints = Math.max(...reindeers.map(e => e.points));

      if (visualization) {
        visConsole.addLine(`After ${time} seconds:`);
        visConsole.addLine();
        for (let reindeer of reindeers) {
          if (part == 1) {
            visConsole.addLine(`${reindeer.name}: ${reindeer.distance} km.`);
            if (reindeer.distance == maxDistance)
              visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          }
          else {
            visConsole.addLine(`${reindeer.name}: ${reindeer.points} points.`);
            if (reindeer.points == maxPoints)
              visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          }
        }
      }
    
      return part == 1 ? maxDistance : maxPoints;
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
 * Puzzle reindeer  class.
 */
class Reindeer  {
  /**
   * @param {string} name Name.
   * @param {number} speed Speed.
   * @param {number} flyTime Fly time.
   * @param {number} restTime Rest time.
   */
  constructor(name, speed, flyTime, restTime) {
    /**
     * Name.
     * @type {string}
     */
    this.name = name;
    /**
     * Speed.
     * @type {number}
     */
    this.speed = speed;
    /**
     * Fly time.
     * @type {number}
     */
    this.flyTime = flyTime;
    /**
     * Rest time.
     * @type {number}
     */
    this.restTime = restTime;
    /**
     * Distance.
     * @type {number}
     */
    this.distance = 0;
    /**
     * Points.
     * @type {number}
     */
    this.points = 0;
  }
}