import { delay, Console, Range } from "../../utility.mjs";

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
   * @returns {{
   * seedRanges: Range[],
   * maps: Map[]
   * }} Seed ranges and maps.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let seedRanges = [];
    let maps = [];
    let currentSource = "seed";

    input.trim().split(/\r?\n/).forEach((line, index) => {
      if (index == 0) {
        let match = line.match(/^seeds: ([ \d]+)$/);
        if (match == null)
          throw new Error(`Invalid data in line ${index + 1}`);
          seedRanges = match[1].split(" ").map(e => new Range(parseInt(e.trim()), parseInt(e.trim())));
        if (seedRanges.length == 0 || seedRanges.length % 2 != 0)
          throw new Error(`Invalid data in line ${index + 1}`);
      }
      else {
        if (line != "") {
          let match = new RegExp(`^${currentSource}-to-(.+) map:$`).exec(line);
          if (match != null) {
            maps.push(new Map(match[1]));
            currentSource = match[1];
          }
          else {
            if (maps.length == 0)
              throw new Error(`Invalid data in line ${index + 1}`);
            match = line.match(/^(\d+) (\d+) (\d+)$/);
            maps[maps.length - 1].srcRanges.push(new Range(parseInt(match[2]), parseInt(match[2]) + parseInt(match[3]) - 1));
            maps[maps.length - 1].destRanges.push(new Range(parseInt(match[1]), parseInt(match[1]) + parseInt(match[3]) - 1));
          }
        }
      }
    });

    consoleLine.innerHTML += " done.";
    return { seedRanges, maps };
  }

  /**
   * Calculates the lowest location number.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Lowest location number.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {seedRanges, maps} = this.parse(input);

      let visConsole = new Console();

      // Conver seed numbers to seed ranges numbers (part 2)
      if (part == 2) {
        let newSeedRanges = [];
        for (let i = 0; i < seedRanges.length; i += 2)
        newSeedRanges.push(new Range(seedRanges[i].from, seedRanges[i].from + seedRanges[i + 1].from - 1));
        seedRanges = newSeedRanges;
      }

      seedRanges.sort((r1, r2) => r1.from - r2.from);

      if (visualization)
        this.visContainer.append(visConsole.container);

      if (visualization) {
        visConsole.addLine(`Seed ranges:`);
        visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
        visConsole.addLine(`${seedRanges.map(e => `${e.from}..${e.to}`).join("\n")}`);
        visConsole.addLine();
      }

      // Find ranges for all maps
      let srcRanges = seedRanges;
      let destRanges;
      for (let map of maps) {
        destRanges = [];
        for (let i = 0; i < map.srcRanges.length; i++) {
          let mapRangeShift = map.destRanges[i].from - map.srcRanges[i].from;
          let newSrcRanges = [];
          for (let srcRange of srcRanges) {
            // Find overlap between the source range and the map source range
            let srcRangeParts = srcRange.overlap(map.srcRanges[i]);
            
            if (srcRangeParts[0] != null)
              newSrcRanges.push(srcRangeParts[0]);
            if (srcRangeParts[1] != null)
              destRanges.push(new Range(srcRangeParts[1].from + mapRangeShift, srcRangeParts[1].to + mapRangeShift));
            if (srcRangeParts[2] != null)
              newSrcRanges.push(srcRangeParts[2]);
          }

          srcRanges = newSrcRanges;
        }

        // Concatenate shifted and non-shifted ranges
        destRanges = [...destRanges, ...srcRanges];
        
        // Sort ranges according to range start
        destRanges.sort((r1, r2) => r1.from - r2.from);
        
        // Combine ranges
        destRanges = Range.combine(destRanges);

        srcRanges = destRanges;

        if (visualization) {
          visConsole.addLine(`${map.destName.charAt(0).toUpperCase() + map.destName.slice(1)} ranges:`);
          visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          visConsole.addLine(`${destRanges.map(e => `${e.from}..${e.to}`).join("\n")}`);
          visConsole.addLine();
        }
      }

      return destRanges[0].from;
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
 * Puzzle map class.
 */
class Map {
  /**
   * @param {string} destName Destination name.
   * @param {Range[]} srcRanges Source ranges.
   * @param {Range[]} destRanges Destination ranges.
   */
  constructor(destName, srcRanges = [], destRanges = []) {
    /**
     * Destination name.
     * @type {string}
     */
    this.destName = destName;
    /**
     * Source ranges.
     * @type {Range[]}
     */
    this.srcRanges = srcRanges;
    /**
     * Destination ranges.
     * @type {Range[]}
     */
    this.destRanges = destRanges;
  }
}