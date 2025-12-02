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

      // Ignore in tests
      if (typeof window === 'undefined')
        return;

      let key = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      for (let number = 0; ; number++) {
        let md5 = CryptoJS.MD5(key + number);
        let md5Start = md5.words[0];
        if ((part == 1 ? (md5Start & 0xFFFFF000) : (md5Start & 0xFFFFFF00)) == 0) {
          if (visualization) {
            visConsole.addLine(`MD5 hash of ${key}<span class="highlighted">${number}</span>:`);
            let numberOfZeroes = part == 1 ? 5 : 6;
            visConsole.addLine(`<span class="strongly-highlighted">${"0".repeat(numberOfZeroes)}</span>${md5.toString().substring(numberOfZeroes)}`);
          }

          return number;
        }
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