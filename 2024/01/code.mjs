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
   * @returns {number[][]} Location IDs.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let locationIds = [[], []];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match;
      if ((match = line.match(/^(\d+)\s+(\d+)$/)) == null)
        throw new Error(`Invalid data in line ${index + 1}`);

      locationIds[0].push(parseInt(match[1]));
      locationIds[1].push(parseInt(match[2]));
    });
    
    consoleLine.innerHTML += " done.";
    return locationIds;
  }

  /**
   * Calculates the total distance between location IDs (part 1) or the total similarity score (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Total distance between location IDs (part 1) or the total similarity score (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let locationIds = this.parse(input);

      let visConsole = new Console();

      let total = 0;

      if (visualization)
        this.visContainer.append(visConsole.container);

      // Find the total distance between location IDs
      if (part == 1) {
        // Sort location IDs
        locationIds[0].sort();
        locationIds[1].sort();

        for (let pairIndex = 0; pairIndex < locationIds[0].length; pairIndex++) {
          if (this.isStopping)
            return;
  
          // Find distance
          let id1 = locationIds[0][pairIndex];
          let id2 = locationIds[1][pairIndex];
          let distance = Math.abs(id1 - id2);
  
          if (visualization) {
            let visConsoleLine = visConsole.addLine();
            visConsoleLine.innerHTML = `${Math.max(id1, id2)} - ${Math.min(id1, id2)} = ${distance}`;
          }
   
          total += distance;
        }
      }

      // Find the total similarity score (part 2)
      else {
        for (let locationIdIndex = 0; locationIdIndex < locationIds[0].length; locationIdIndex++) {
          if (this.isStopping)
            return;
  
          // Find similarity score
          let locationId = locationIds[0][locationIdIndex];
          let similarityScore = locationId * locationIds[1].filter(e => e == locationId).length;
  
          if (visualization) {
            let visConsoleLine = visConsole.addLine();
            visConsoleLine.innerHTML = `Location ${locationIds[0][locationIdIndex]} similarity score is ${similarityScore}.`;
          }
   
          total += similarityScore;
        }
      }      
        
      return total;
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