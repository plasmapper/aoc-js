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
   * @returns {number[]} Lengths.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    input = input.trim();
    if (!/^[\d,]+$/.test(input))
      throw new Error("Invalid input data");

    let lengths = input.split(",").map(e => parseInt(e));

    consoleLine.innerHTML += " done.";
    return lengths;
  }

  /**
   * Finds the result of multiplying the first two numbers in the list after hash process (part 1) or the Knot Hash of the input (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number|string} Result of multiplying the first two numbers in the list after hash process (part 1) or the Knot Hash of the input (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let lengths = this.parse(input);
      let list = new Array(lengths.length > 5 || part == 2 ? 256 : 5).fill(null).map((e, i) => i);
      let numberOfRounds = part == 1 ? 1 : 64;

      if (part == 2)
        lengths = [...lengths.join(",").split("").map(e => e.charCodeAt(0)), 17, 31, 73, 47, 23];

      let visConsole = new Console();
      let solConsoleLine;
      if (visualization) {
        this.solConsole.addLine(`Number of rounds: ${numberOfRounds}.`);
        solConsoleLine = this.solConsole.addLine();
        this.visContainer.append(visConsole.container);
        list.forEach(e => visConsole.addLine());
      }

      let currentPosition = 0, skipSize = 0;
      for (let round = 0; round < numberOfRounds; round++) {
        for (let length of lengths) {
          if (this.isStopping)
            return;

          let newList = list.slice();
          for (let i = 0; i < length; i++)
            newList[(currentPosition + i) % list.length] = list[(currentPosition + length - 1 - i) % list.length];
          list = newList;
          currentPosition = (currentPosition + length + (skipSize++)) % list.length;

          if (visualization) {
            solConsoleLine.innerHTML = `Round: ${round + 1}.`;
            list.forEach((e, i) => visConsole.lines[i].innerHTML = e);
            await delay(1);
          }
        }
      }

      if (part == 1) {
        if (visualization) {
          visConsole.lines[0].classList.add("highlighted");
          visConsole.lines[1].classList.add("highlighted");
        }
        return list[0] * list[1];
      }

      let denseHash = "";
      for (let i = 0; i < 16; i++)
        denseHash += list.slice(i * 16, (i + 1) * 16).reduce((acc, e) => acc ^ e, 0).toString(16).padStart(2, "0");

      return denseHash;
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