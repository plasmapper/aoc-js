import { delay, Console } from "../../utility.mjs";

const patternWidth = 5;
const patternHeight = 7;

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
    this.noPart2 = true;
  }
  
 /**
   * Parses the puzzle input.
   * @param {string} input Puzzle input.
   * @returns {{
   * locks: number[][],
   * keys: number[][]
   * }} Locks and keys.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let locks = [];
  let keys = [];
  let patternIsLock;
  let pattern = new Array(patternWidth).fill(0);

  let lines = input.trim().split(/\r?\n/);
  lines.forEach((line, lineIndex) => {
    line = line.trim();
    if (lineIndex % (patternHeight + 1) == patternHeight && line.length != 0)
      throw new Error(`Invalid length of line ${lineIndex + 1}`);
    if (lineIndex % (patternHeight + 1) != patternHeight && line.length != patternWidth)
      throw new Error(`Invalid length of line ${lineIndex + 1}`);
    if (!/^[\.#]*$/.test(line))
      throw new Error(`Invalid data in line ${lineIndex + 1}`);

    if (lineIndex % (patternHeight + 1) == 0) {
      if (/^#+$/.test(line))
        patternIsLock = true;
      else if (/^\.+$/.test(line))
        patternIsLock = false;
      else
        throw new Error(`Invalid data in line ${lineIndex + 1}`);
    }
    else if (lineIndex % (patternHeight + 1) == patternHeight - 1) {
      if ((patternIsLock && !/^\.+$/.test(line)) || (!patternIsLock && !/^#+$/.test(line)))
        throw new Error(`Invalid data in line ${lineIndex + 1}`);
      if (patternIsLock)
        locks.push(pattern);
      else
        keys.push(pattern);
        pattern = new Array(patternWidth).fill(0);
    }
    else {
      for (let i = 0; i < patternWidth; i++) {
        if ((patternIsLock && line[i] == "#" && lines[lineIndex - 1][i] != "#") || (!patternIsLock && line[i] == "." && lines[lineIndex - 1][i] != "."))
          throw new Error(`Invalid data in line ${lineIndex + 1}`);
        pattern[i] += line[i] == "#" ? 1 : 0;
      }      
    }
  });

  consoleLine.innerHTML += " done.";
  return { locks, keys };
}

  /**
   * Calculates the number of matching lock/key pairs.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of matching lock/key pairs.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let { locks, keys } = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);


      let numberOfMatchingPairs = 0;
      for (let lockIndex = 0; lockIndex < locks.length; lockIndex++) {
        for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
          let lock = locks[lockIndex];
          let key = keys[keyIndex];
          // Key matches the lock if the sum of pin heights is less or equal to maximum pin height
          if (lock.reduce((acc, e, i) => acc && (e + key[i] <= patternHeight - 2), true)) {
            numberOfMatchingPairs++;

            if (visualization) {
              visConsole.addLine(`Lock ${lockIndex + 1} and key ${keyIndex + 1}:`);
              for (let y = 0; y < patternHeight; y++) {
                let line = "";
                for (let x = 0; x < patternWidth; x++) {
                  let isLock = y == 0 || (y - 1 < lock[x]);
                  let isKey = y == patternHeight - 1 || (patternHeight - y - 1 <= key[x]);
                  line += isLock ? `<span class="weakly-highlighted">#</span>` : (isKey ? `<span class="highlighted">#</span>` : ".");
                }
                visConsole.addLine(line);
              }
              visConsole.addLine();
            }
          }
        }
      }
      
      return numberOfMatchingPairs;
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