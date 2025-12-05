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
   * @returns {number[][]} Battery banks.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let batteryBanks = input.trim().split(/\r?\n/).map((line, index) => {
      if (!/^(\d+)$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return line.split("").map(e => parseInt(e));
    });

    consoleLine.innerHTML += " done.";
    return batteryBanks;
  }
  
  /**
   * Finds the total output joltage.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Total output joltage.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let batteryBanks = this.parse(input);

      let numberOfBatteriesToTurnOn = part == 1 ? 2 : 12;

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let totalJoltage = 0;

      for (let batteryBank of batteryBanks) {
        let digitIndexes = [];
        for (let i = 0; i < numberOfBatteriesToTurnOn; i++) {
          let startSearchIndex = i == 0 ? 0 : digitIndexes[i - 1] + 1;
          let endSearchIndex = batteryBank.length - numberOfBatteriesToTurnOn + i;
          let batteryBankPart = batteryBank.slice(startSearchIndex, endSearchIndex + 1);
          digitIndexes.push(batteryBankPart.indexOf(Math.max(...batteryBankPart)) + startSearchIndex);
        }

        totalJoltage += digitIndexes.reduce((acc, e, i) => acc + batteryBank[e] * Math.pow(10, numberOfBatteriesToTurnOn - i - 1), 0);
        
        if (visualization) {
          let visConsoleString = "";
          for (let i = 0; i < batteryBank.length; i++)
            visConsoleString += `<span${digitIndexes.includes(i) ? " class='highlighted'" : ""}>${batteryBank[i]}</span>`
          visConsole.addLine(visConsoleString);
        }
      }

      return totalJoltage;
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