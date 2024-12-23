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
   * @returns {CubeSet[][]} Games.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let games = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match;
      if ((match = line.match(/^\Game (\d+):(.+)$/)) == null || parseInt(match[1]) != index + 1)
        throw new Error(`Invalid data in line ${index + 1}`);

      games.push([]);

      match[2].split(";").forEach(setString => {
        let set = new CubeSet(0, 0, 0)
        setString.split(",").forEach(colorString => {
          colorString = colorString.trim();
          if ((match = colorString.match(/^(\d+) (red|green|blue)$/)) == null)
            throw new Error(`Invalid data in line ${index + 1}`);
          if (match[2] == "red")
            set.red = parseInt(match[1]);
          if (match[2] == "green")
            set.green = parseInt(match[1]);
          if (match[2] == "blue")
            set.blue = parseInt(match[1]);
        });
        games[games.length - 1].push(set);
      });
    });
    
    consoleLine.innerHTML += " done.";
    return games;
  }

  /**
   * Calculates the sum of the IDs of possible games (part 1) or the sum of the power of mimimum game sets (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of the IDs of possible games (part 1) or the sum of the power of mimimum game sets (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let games = this.parse(input);

      let visConsole = new Console();

      let idSum = 0;
      let powerSum = 0;

      if (visualization)
        this.visContainer.append(visConsole.container);
      
      for (let [gameIndex, game] of games.entries()) {
        if (this.isStopping)
          return;

        // Find the minimum number of cubes of each color for the game to be possible
        let minCubeSet = game.reduce((acc, e) => {
          acc.red = Math.max(acc.red, e.red);
          acc.green = Math.max(acc.green, e.green);
          acc.blue = Math.max(acc.blue, e.blue);
          return acc;
        }, new CubeSet(0, 0, 0));

        // Check if the game is possible (part 1)
        let gameIsPossible = minCubeSet.red <= 12 && minCubeSet.green <= 13 && minCubeSet.blue <= 14;
        if (gameIsPossible)
          idSum += gameIndex + 1;

        // Add the minimum set power to the sum (part 2)
        let minCubeSetPower = minCubeSet.power();
        powerSum += minCubeSetPower;

        if (visualization) {
          visConsole.addLine(`Game ${gameIndex + 1}:\nred >= ${minCubeSet.red}, blue >= ${minCubeSet.green}, green >= ${minCubeSet.blue}.`);
          if (part == 1 && gameIsPossible)
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          if (part == 2)
            visConsole.lines[visConsole.lines.length - 1].innerHTML += `\nMinimum set power: ${minCubeSetPower}.`;
          visConsole.addLine();
        }
      }

      return part == 1 ? idSum : powerSum;
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
 * Puzzle cube set class.
 */
class CubeSet {
  /**
   * @param {number} red Number of red cubes.
   * @param {number} green Number of green cubes.
   * @param {number} blue Number of blue cubes.
   */
  constructor(red, green, blue) {
    /**
     * Number of red cubes.
     * @type {number}
     */
    this.red = red;
    /**
     * Number of green cubes.
     * @type {number}
     */
    this.green = green;
    /**
     * Number of blue cubes.
     * @type {number}
     */
    this.blue = blue;
  }

  /**
   * Calculates the power of the set.
   * @returns Power of the set.
   */
  power() {
    return this.red * this.green * this.blue;
  }
}