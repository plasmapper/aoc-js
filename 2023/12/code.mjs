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
   * @returns {Record[]} Spring records.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let records = [];
    input.trim().split(/\r?\n/).forEach((line, y) => {
      let match = line.match(/^([\.#\?]+) (\d+(,\d+)*)$/);

      if (match == null)
        throw new Error(`Invalid data in line ${y + 1}`);

      records.push(new Record(match[1].split(""), match[2].split(",").map(e => parseInt(e))));
    });

    consoleLine.innerHTML += " done.";
    return records;
  }

  /**
   * Finds the sum of numbers of possible spring arrangements.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The sum of numbers of possible spring arrangements.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let records = this.parse(input);
      
      // Unfold the records
      if (part == 2) {
        records = records.map(record => {
          let newSprings = [];
          let newDamagedGroupSizes = [];
          for (let i = 0; i < 5; i++) {
            if (i > 0)
              newSprings.push("?");
            newSprings = newSprings.concat(record.springs);
            newDamagedGroupSizes = newDamagedGroupSizes.concat(record.damagedGroupSizes);
          }
          return new Record(newSprings, newDamagedGroupSizes);
        });
      }

      let solConsole = this.solConsole;
      solConsole.addLine(`Number of records: ${records.length}.`)
      let visConsole = new Console();

      if (visualization)
        this.visContainer.append(visConsole.container);

      let sumOfNumbersOfArrangements = 0;

      for (let [recordIndex, record] of records.entries()) {
        // Set the number of arrangements for the last group ranges to 1 if there are no subsequent # symbols
        for (let range of record.damagedGroups[record.damagedGroups.length - 1].possibleRanges)
          range.numberOfArrangements = record.springs.slice(range.to + 1).indexOf("#") == -1 ? 1 : 0;

        // Calculate the numbers of arrangements for groups (check if there are no # symbols between groups)
        for (let i = record.damagedGroups.length - 2; i >= 0; i--) {
          for (let range of record.damagedGroups[i].possibleRanges) {
            range.numberOfArrangements = record.damagedGroups[i + 1].possibleRanges.reduce((acc, e) =>
              acc + (e.from > range.to + 1 && record.springs.slice(range.to + 1, e.from).indexOf("#") < 0 ? e.numberOfArrangements : 0), 0);
          }
        }

        // Calculate the total number of arrangements (check if there are no # symbols before the first group)
        let numberOfArrangements = record.damagedGroups[0].possibleRanges.reduce((acc, e) => acc + (record.springs.slice(0, e.from).indexOf("#") < 0 ? e.numberOfArrangements : 0), 0);
        sumOfNumbersOfArrangements += numberOfArrangements;

        if (visualization)
          visConsole.addLine(`Record ${recordIndex + 1}: ${numberOfArrangements} arrangements.`)
      }

      return sumOfNumbersOfArrangements;
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
 * Puzzle record class
 */
class Record {
  /**
   * @param {string[]} springs Springs (. - operational, # - damaged, ? - unknown).
   * @param {number[]} damagedGroupSizes Sizes of contiguous group of damaged springs.
   */
  constructor(springs, damagedGroupSizes) {
    /**
     * Springs (. - operational, # - damaged, ? - unknown).
     * @type {string[]}
     */
    this.springs = springs;
    /**
     * Sizes of contiguous groups of damaged springs.
     * @type {number[]}
     */
    this.damagedGroupSizes = damagedGroupSizes;
    /**
     * Contiguous groups of damaged springs.
     * @type {DamagedGroup[]}
     */
    this.damagedGroups = damagedGroupSizes.map(e => new DamagedGroup(e));

    // Find minimum start indexes for the groups
    this.damagedGroups[0].minStart = 0;
    for (let i = 1; i < this.damagedGroups.length; i++)
      this.damagedGroups[i].minStart = this.damagedGroups[i - 1].minStart + this.damagedGroups[i - 1].size + 1;

    // Find maximum start indexes for the groups
    this.damagedGroups[this.damagedGroups.length - 1].maxStart = this.springs.length - this.damagedGroups[this.damagedGroups.length - 1].size;
    for (let i = this.damagedGroups.length - 2; i >= 0; i--)
      this.damagedGroups[i].maxStart = this.damagedGroups[i + 1].maxStart - this.damagedGroups[i].size - 1;

    // Find possible location ranges for the group
    for (let group of this.damagedGroups) {
      for (let start = group.minStart; start <= group.maxStart; start++) {
        if ((start == 0 || this.springs[start - 1] != "#") && (start + group.size == this.springs.length || this.springs[start + group.size] != "#")) {
          let i = 0;
          for (; i < group.size && this.springs[start + i] != "."; i++);
          if (i == group.size)
            group.possibleRanges.push(new DamagedGroupRange(start, start + group.size - 1));
        }
      }
    }
  }
}

/**
 * Puzzle damaged spring group class.
 */
class DamagedGroup {
  /**
   * @param {number} size Group size.
   */
  constructor(size) {
    /**
     * Group size.
     * @type {number}
     */
    this.size = size;
    /**
     * Minimum start index.
     * @type {number}
     */
    this.minStart = 0;
    /**
     * Maximum start index.
     * @type {number}
     */
    this.maxStart = 0;
    /**
     * Possible location ranges for the group.
     * @type {DamagedGroupRange[]}
     */
    this.possibleRanges = [];
  }
}

/**
 * Puzzle damaged spring group location range class.
 */
class DamagedGroupRange {
  /**
   * @param {number} from Start index.
   * @param {number} to End index.
   */
  constructor(from, to) {
    /**
     * Start index.
     * @type {number}
     */
    this.from = from;
    /**
     * End index.
     * @type {number}
     */
    this.to = to;
    /**
     * Number of the following group arrangements.
     * @type {number}
     */
    this.numberOfArrangements = 0;
  }
}