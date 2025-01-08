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
   * @returns {string} Password.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let password = input.trim();
    if (!/^[a-z]{8}$/.test(password))
      throw new Error("Invalid input data");

    consoleLine.innerHTML += " done.";
    return password;
  }

  /**
   * Finds the next password.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string} Next password.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let passwords = [this.parse(input)];
      let bytes = passwords[0].split("").map(e => e.charCodeAt(0) - "a".charCodeAt(0));
      let forbiddenBytes = "iol".split("").map(e => e.charCodeAt(0) - "a".charCodeAt(0));

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      for (let iteration = 0; iteration < (part == 1 ? 1 : 2); iteration++) {
        for (let passwordIsValid = false; !passwordIsValid; ) {
          // Increment password
          bytes[bytes.length - 1]++;
          for (let i = bytes.length - 1; i >= 0; i--) {
            if (bytes[i] >= 26) {
              if (i == 0)
                throw new Error("Password can not be increased");
              bytes[i - 1]++;
              bytes[i] -= 26;
            }
          }
  
          // Check if password is valid
          let doubleByteIndexes = bytes.reduce((acc, e, i) => i < bytes.length - 1 && bytes[i + 1] == e ? [...acc, i] : acc, []);
          passwordIsValid = bytes.reduce((acc, e, i) => acc || (i < bytes.length - 2 && bytes[i + 1] == e + 1 && bytes[i + 2] == e + 2), false)
            && !forbiddenBytes.reduce((acc, e) => acc || bytes.includes(e), false)
            && doubleByteIndexes.length >= 2 && (doubleByteIndexes > 2 || doubleByteIndexes[1] - doubleByteIndexes[0] > 1);
        }
  
        passwords.push(bytes.map(e => String.fromCharCode(e + "a".charCodeAt(0))).join(""));
      }
      
      if (visualization)
        visConsole.addLine(passwords.join(" -> "));
      return passwords[passwords.length - 1];
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