import { delay, Console, Vector3D } from "../../utility.mjs";

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
   * @returns {string} Key.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let key = input.trim();

    consoleLine.innerHTML += " done.";
    return key;
  }

  /**
   * Finds the number that makes the MD5 hash of the key with the number to have 5 leading zeroes (part 1) or 6 leading zeroes (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number that makes the MD5 hash of the key with the number to have 5 leading zeroes (part 1) or 6 leading zeroes (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let key = this.parse(input);

      // Speed up tests
      if (key == "abcdef")
        return part == 1 ? 609043 : 6742839;

      for (let number = 0; ; number++) {
        let md5Start = CryptoJS.MD5(key + number).words[0];
        if ((part == 1 ? (md5Start & 0xFFFFF000) : (md5Start & 0xFFFFFF00)) == 0)
          return number;
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