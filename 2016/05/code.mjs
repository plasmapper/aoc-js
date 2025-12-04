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
    this.isMD5Calculation = true;
  }
  
 /**
   * Parses the puzzle input.
   * @param {string} input Puzzle input.
   * @returns {string} Door ID.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let doorId = input.trim();

    consoleLine.innerHTML += " done.";
    return doorId;
  }

  /**
   * Finds the password.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string} Password.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let doorId = this.parse(input);
      let passwordSize = 8;
      let password = new Array(passwordSize).fill(null);

      let solConsole = this.solConsole;
      let solConsoleLine;
      let visConsole = new Console();
      if (visualization) {
        solConsoleLine = solConsole.addLine(`Password: ${password.map(e => e == null ? "_" : e).join("")}.`);
        this.visContainer.append(visConsole.container);
        await delay(1);
      }

      let index = 0;
      while (password.indexOf(null) >= 0) {
        if (this.isStopping)
          return;

        let md5;
        while (((md5 = CryptoJS.MD5(doorId + index)).words[0] & 0xFFFFF000) != 0)
          index++;
        index++;

        let md5String = md5.toString();

        if (visualization)
          visConsole.addLine(`MD5 hash of ${doorId + index}:`);

        if (part == 1) {
          let characterIndex = password.indexOf(null);
          password[characterIndex] = md5String[5];
          if (visualization) {
            solConsoleLine.innerHTML = `Password: ${password.map(e => e == null ? "_" : e).join("")}.`;
            visConsole.addLine(`<span class="highlighted">${md5String.substring(0, 5)}</span>`
              + `<span class="strongly-highlighted">${md5String[5]}</span>${md5String.substring(6)}`);
            await delay(1);
          }
        }
        else {
          let characterIndex = parseInt(md5String[5], 16);
          if (characterIndex < passwordSize && password[characterIndex] == null)
            password[characterIndex] = md5String[6];
          if (visualization) {
            solConsoleLine.innerHTML = `Password: ${password.map(e => e == null ? "_" : e).join("")}.`;
            visConsole.addLine(`<span class="highlighted">${md5String.substring(0, 5)}</span>`
              + `<span class="weakly-highlighted">${md5String[5]}</span><span class="strongly-highlighted">${md5String[6]}</span>${md5String.substring(7)}`);
            await delay(1);
          }
        }
      }

      return password.join("");
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