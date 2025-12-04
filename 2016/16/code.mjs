import { delay, Console } from "../../utility.mjs";

export default class {
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
   * @returns {string} Initial state.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let initialState = input.trim();
    if (!/^[01]+$/.test(initialState))
      throw new Error("Invalid input data");

    consoleLine.innerHTML += " done.";
    return initialState;
  }

  /**
   * Finds the correct checksum.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string} Correct checksum.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let initialState = this.parse(input);
      let diskSize = initialState.length < 10 ? 20 : (part == 1 ? 272 : 35651584);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);
      
      let sequenceA = initialState.split("").map(e => parseInt(e));
      // Inverted initial sequence
      let sequenceB = sequenceA.map(e => e == 0 ? 1 : 0).reverse();
      
      // 2 means sequence A, 3 means sequence B
      // Fill the disk with data
      let data = [2];
      while ((data.length - 1) / 2 + (data.length + 1) / 2 * sequenceA.length < diskSize) {
        data.push(0);
        for (let i = data.length - 2; i >= 0; i--)
          data.push(data[i] == 2 ? 3 : (data[i] == 3 ? 2 : (data[i] == 0 ? 1 : 0)));
      }
      data.push(0);

      // Calculate the number of checksum iterations and the result checksum size
      let totalNumberOfChecksumIterations = 0;
      let resultChecksumSize = diskSize;
      for (; resultChecksumSize % 2 == 0; resultChecksumSize /= 2, totalNumberOfChecksumIterations++);

      let numberOfChecksumIterations = totalNumberOfChecksumIterations;

      // Make several checksum calculation iterations for typical sequences
      let a0b0Checksum = [...sequenceA, 0, ...sequenceB, 0];
      let a0b1Checksum = [...sequenceA, 0, ...sequenceB, 1];
      let a1b0Checksum = [...sequenceA, 1, ...sequenceB, 0];
      let a1b1Checksum = [...sequenceA, 1, ...sequenceB, 1];
      for (; numberOfChecksumIterations > 0 && a0b0Checksum.length % 2 == 0; numberOfChecksumIterations--) {
        a0b0Checksum = a0b0Checksum.reduce((acc, e, i, checksum) => i % 2 ? acc : [...acc, checksum[i] == checksum[i + 1] ? 1 : 0], [])
        a0b1Checksum = a0b1Checksum.reduce((acc, e, i, checksum) => i % 2 ? acc : [...acc, checksum[i] == checksum[i + 1] ? 1 : 0], [])
        a1b0Checksum = a1b0Checksum.reduce((acc, e, i, checksum) => i % 2 ? acc : [...acc, checksum[i] == checksum[i + 1] ? 1 : 0], [])
        a1b1Checksum = a1b1Checksum.reduce((acc, e, i, checksum) => i % 2 ? acc : [...acc, checksum[i] == checksum[i + 1] ? 1 : 0], [])
      }

      // Make the rest of checksum calculation iterations
      let checksum = [];
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 1] == 0 && data[i + 3] == 0)
          checksum.push(...a0b0Checksum);
        if (data[i + 1] == 0 && data[i + 3] == 1)
          checksum.push(...a0b1Checksum);
        if (data[i + 1] == 1 && data[i + 3] == 0)
          checksum.push(...a1b0Checksum);
        if (data[i + 1] == 1 && data[i + 3] == 1)
          checksum.push(...a1b1Checksum);
      }

      for (let i = 0; i < numberOfChecksumIterations; i++) {
        let newChecksum = [];
        for (let j = 0; j < checksum.length; j += 2)
          newChecksum.push(checksum[j] == checksum[j + 1] ? 1 : 0);
        checksum = newChecksum;
      }

      checksum = checksum.slice(0, resultChecksumSize).join("");

      if (visualization) {
        visConsole.addLine(`Disk size: ${diskSize}.`)
        visConsole.addLine(`Checksum iterations: ${totalNumberOfChecksumIterations}.`)
        visConsole.addLine(`Checksum: <span class="highlighted">${checksum}</span>.`)
      }

      return checksum;
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