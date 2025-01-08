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
   * @returns {Map<string, Map<string, number>} Distance map.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let map = new Map();
    input.trim().split(/\r?\n/).map((line, index) => {
      let match;
      if ((match = line.match(/^(.+) to (.+) = (\d+)$/)) == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      if (!map.has(match[1]))
        map.set(match[1], new Map());
      if (!map.has(match[2]))
        map.set(match[2], new Map());
      map.get(match[1]).set(match[2], parseInt(match[3]));
      map.get(match[2]).set(match[1], parseInt(match[3]));
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds the distance of the shortest (part 1) or the longest (part 2) route.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Distance of the shortest (part 1) or the longest (part 2) route.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let map = this.parse(input);
      let locations = [...map.keys()];

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Find all routes
      let routes = [locations.map(e => [e])];
      for (let i = 0; i < locations.length - 1; i++) {
        routes.push([]);
        for (let route of routes[i]) {
          for (let location of locations) {
            if (!route.includes(location)) {
              let newRoute = route.slice();
              newRoute.push(location);
              routes[routes.length - 1].push(newRoute);
            }
          }
        }
      }

      // Find the shortest (part 1) or the longest (part 2) route
      let resultRoute = [];
      let resultDistance = part == 1 ? Number.MAX_VALUE : Number.MIN_VALUE;
      for (let route of routes[locations.length - 1]) {
        let distance = 0;
        for (let i = 1; i < route.length; i++)
          distance += map.get(route[i]).get(route[i - 1]);
        if ((part == 1 && distance < resultDistance) || (part == 2 && distance > resultDistance)) {
          resultRoute = route;
          resultDistance = distance;
        }
      }

      if (visualization)
        visConsole.addLine(`${resultRoute.join(" -> ")} = ${resultDistance}`);
    
      return resultDistance;
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