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
   * @returns {string} Compressed file.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let compressedFile = input.trim().split(/\r?\n/).join("");

    consoleLine.innerHTML += " done.";
    return compressedFile;
  }

  /**
   * Finds the decompressed file size.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Decompressed file size.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let compressedFile = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let decompressedFileSize = this.calculateDecompressedSize(compressedFile, part == 1 ? false : true);

      if (visualization) {
        visConsole.addLine(`Compressed file size: ${compressedFile.length}.`);
        visConsole.addLine(`Decompressed file size: ${decompressedFileSize}.`);
      }

      return decompressedFileSize;
    }
    
    finally {
      this.isSolving = false;
    }
  }

  /**
   * Calculates the decompressed data size.
   * @param {string} data Data.
   * @param {boolean} recursive Enable recursive decompression.
   * @returns {number} Decompressed data size.
   */
  calculateDecompressedSize(data, recursive) {
    let size = 0;
    while (data.length) {
      let match = data.match(/\((\d+)x(\d+)\)/);
      if (match == null) {
        size += data.length;
        data = "";
      }
      else {
        let index = match.index;
        let length = parseInt(match[1]);
        let numberOfRepetitions = parseInt(match[2]);
        size += index;
        if (recursive)
          size += this.calculateDecompressedSize(data.substring(index + match[0].length, index + match[0].length + length), true) * numberOfRepetitions;
        else
          size += length * numberOfRepetitions;
        data = data.substring(index + match[0].length + length);
      }
    }
    return size;
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