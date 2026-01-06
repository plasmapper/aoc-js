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
   * @returns {string[][]} Passphrases.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let passphrases = input.trim().split(/\r?\n/).map((line, index) => {
      if (!/^[\sa-z]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return line.split(" ");
    });

    consoleLine.innerHTML += " done.";
    return passphrases;
  }


  /**
   * Finds the number of valid passphrases.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of valid passphrases.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let passphrases = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let numberOfValidPassphrases = 0;
      for (let passphrase of passphrases) {
        let passphraseWithSortedWords = passphrase.map(e => e.split("").sort().join(""))
        let invalidWordIndexPair = null;
        for (let i = 0; i < passphrase.length && invalidWordIndexPair == null; i++) {
          for (let j = i + 1; j < passphrase.length && invalidWordIndexPair == null; j++) {
            if ((part == 1 && passphrase[i] == passphrase[j]) || (part == 2 && passphraseWithSortedWords[i] == passphraseWithSortedWords[j]))
              invalidWordIndexPair = [i, j];
          }
        }

        if (invalidWordIndexPair == null)
          numberOfValidPassphrases++;

        if (visualization) {
          visConsole.addLine(passphrase.map((e, i) =>
            invalidWordIndexPair == null ? `<span class="highlighted">${e}</span>` : (invalidWordIndexPair.indexOf(i) >= 0 ? `<span class="error">${e}</span>` : e)).join(" "));
          visConsole.addLine();
        }
      }

      return numberOfValidPassphrases;
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