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
   * @returns {string[][]} Rucksacks.
   */
  parse(input) {
    const groupSize = 3;

    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let rucksacks = [];
    if (input.trim().split(/\r?\n/).length % groupSize)
      throw new Error(`The number of lines must be divisible by ${groupSize}`);
    input.trim().split(/\r?\n/).forEach((line, index) => {
      if (!/^[a-zA-Z]+$/.test(line) || line.length % 2)
        throw new Error(`Invalid data in line ${index + 1}`);
      rucksacks.push ([line.substring(0, line.length / 2).split(""), line.substring(line.length / 2).split("")]);
    });
    
    consoleLine.innerHTML += " done.";
    return rucksacks;
  }

  /**
   * Finds shared items in rucksacks and calculates the priority sum (part 1) or finds badges in rucksacks and calculates the badge sum (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Priority sum (part 1) or badge sum (part 2).
   */
  async solve(part, input, visualization) {
    const groupSize = 3;
    const charCodes = {a: "a".charCodeAt(0), z: "z".charCodeAt(0), A: "A".charCodeAt(0), Z: "Z".charCodeAt(0)}

    try {
      this.isSolving = true;

      let rucksacks = this.parse(input);

      let solConsole = this.solConsole;
      let visConsole = new Console();

      // Find shared items in rucksacks and calculates the priority sum (part 1)
      if (part == 1) {
        let prioritySum = 0;
    
        if (visualization) {
          this.visContainer.append(visConsole.container);
    
          for (let [rucksackIndex, rucksack] of rucksacks.entries()) {
            visConsole.addLine(`Rucksack ${rucksackIndex + 1}:`);
            for (let compartment of rucksack) {
              let visConsoleLine = visConsole.addLine();
              for (let item of compartment)
                visConsoleLine.innerHTML += `<span>${item}</span>`;
            }
            visConsole.addLine();
            visConsole.addLine();
          }
        }
    
        for (let [rucksackIndex, rucksack] of rucksacks.entries()) {
          if (this.isStopping)
            return;
    
          let commonItem = rucksack[0].filter(item => rucksack[1].includes(item))[0];
          if (commonItem == undefined)
            throw new Error(`No common item found in rucksack ${rucksackIndex + 1}`);
    
          let charCode = commonItem.charCodeAt(0);
          let priority = charCode >= charCodes.a && charCode <= charCodes.z ? charCode - charCodes.a + 1 : charCode - charCodes.A + 27;
          prioritySum += priority;
    
          if (visualization) {
            visConsole.lines[rucksackIndex * 5 + 1].children[rucksack[0].indexOf(commonItem)].classList.add("highlighted");
            visConsole.lines[rucksackIndex * 5 + 2].children[rucksack[1].indexOf(commonItem)].classList.add("highlighted");
            visConsole.lines[rucksackIndex * 5 + 3].innerHTML = `Priority: ${priority}.`;
          }
        }
        
        return prioritySum;
      }
      // Find badges in rucksacks and calculates the badge sum (part 2)
      else {
        let badgeSum = 0;
    
        if (visualization) {
          this.visContainer.append(visConsole.container);
    
          for (let [rucksackIndex, rucksack] of rucksacks.entries()) {
            if (rucksackIndex % groupSize == 0)
              visConsole.addLine(`Group ${rucksackIndex / groupSize + 1}:`);
            for (let compartment of rucksack) {
              let visConsoleLine = visConsole.addLine();
              for (let item of compartment)
                visConsoleLine.innerHTML += `<span>${item}</span>`;
            }
            if (rucksackIndex % groupSize == groupSize - 1) {
              visConsole.addLine();
              visConsole.addLine();
            }
          }
        }
    
        for (let group = 0; group < rucksacks.length / groupSize; group++) {
          if (this.isStopping)
            return;
    
          let badge = rucksacks[group * groupSize][0].concat(rucksacks[group * groupSize][1])
            .filter(item => rucksacks[group * groupSize + 1][0].concat(rucksacks[group * groupSize + 1][1]).includes(item))
            .filter(item => rucksacks[group * groupSize + 2][0].concat(rucksacks[group * groupSize + 2][1]).includes(item))[0];
          if (badge == undefined)
            throw new Error(`No badge found for group ${group + 1}`);
    
          let charCode = badge.charCodeAt(0);
          let priority = charCode >= charCodes.a && charCode <= charCodes.z ? charCode - charCodes.a + 1 : charCode - charCodes.A + 27;
          badgeSum += priority;
    
          if (visualization) {
            let index;
            for (let r = 0; r < groupSize; r++) {
              for (let c = 0; c < 2; c++) {
                if ((index = rucksacks[group * groupSize + r][c].indexOf(badge)) >= 0)
                visConsole.lines[group * (groupSize * 2 + 3) + r * 2 + c + 1].children[index].classList.add("highlighted");
              }
            }
            visConsole.lines[group * (groupSize * 2 + 3) + groupSize * 2 + 1].innerHTML = `Priority: ${priority}.`;
          }
        }
        
        return badgeSum;
      }
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