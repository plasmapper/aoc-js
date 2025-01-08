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
   * @returns {object[]} Sues.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let sues = input.trim().split(/\r?\n/).map((line, index) => {
      let match;
      if ((match = line.match(/^Sue \d+: (([a-z]+: \d+)((, [a-z]+: \d+)+)?)$/)) == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      let sue = {};
      for (let compound of match[1].split(", "))
        sue[compound.split(": ")[0]] = parseInt(compound.split(": ")[1]);
      return sue;
    });

    consoleLine.innerHTML += " done.";
    return sues;
  }

  /**
   * Finds the number of the Sue.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of the Sue.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let sues = this.parse(input);
      let mfcsamData = {
        children: 3,
        cats: 7,
        samoyeds: 2,
        pomeranians: 3,
        akitas: 0,
        vizslas: 0,
        goldfish: 5,
        trees: 3,
        cars: 2,
        perfumes: 1
      };

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      for (let i = 0; i < sues.length; i++) {
        let sue = sues[i];
        let match = true;
        for (let key in mfcsamData) {
          if (sue[key] != undefined) {
            if (part == 2 && (key == "cats" || key == "trees")) {
              if (sue[key] <= mfcsamData[key])
                match = false;
            }
            else if (part == 2 && (key == "pomeranians" || key == "goldfish")) {
              if (sue[key] >= mfcsamData[key])
                match = false;
            }
            else {
              if (sue[key] != mfcsamData[key])
                match = false;
            }
          }
        }
        
        if (match) {
          if (visualization) {
            visConsole.addLine(`MFCSAM data:`);
            Object.keys(mfcsamData).forEach(key => {
              if (part == 2 && (key == "cats" || key == "trees"))
                visConsole.addLine(`  ${key} > ${mfcsamData[key]}`);
              else if (part == 2 && (key == "pomeranians" || key == "goldfish"))
                visConsole.addLine(`  ${key} < ${mfcsamData[key]}`);
              else
                visConsole.addLine(`  ${key} = ${mfcsamData[key]}`);
            });
            visConsole.addLine();
            visConsole.addLine(`Sue ${i + 1}:\n${Object.keys(sue).map(key => `  ${key} = ${sue[key]}`).join("\n")}`);
          }
          return i + 1;
        }
      }

      throw new Error("Sue not found");
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