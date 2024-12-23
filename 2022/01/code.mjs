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
   * @returns {number[][]} Elves as an array of calorie arrays.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let elves = [[]];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      if (!/^\d+$/.test(line) && line != "")
        throw new Error(`Invalid data in line ${index + 1}`);
      if (line == "")
        elves.push([]);
      else
        elves[elves.length - 1].push(parseInt(line));
    });
    
    consoleLine.innerHTML += " done.";
    return elves;
  }

  /**
   * Calculates the sum of calories for the elves who carry the most calories.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The sum of calories for the elves who carry the most calories.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let elves = this.parse(input);
      let numberOfTopElves = part == 1 ? 1 : 3;

      let solConsole = this.solConsole;
      let visConsole = new Console();
      let visLineIndex = 0;

      let maxCalories = new Array(numberOfTopElves).fill(0);

      if (visualization) {
        this.visContainer.append(visConsole.container);

        for (let elf of elves) {
          for (let item of elf)
            visConsole.addLine(item);
          visConsole.addLine();
          visConsole.addLine();
        }
      }
      
      for (let elf of elves) {
        if (this.isStopping)
          return;

        let calories = 0;
        for (let item of elf) {
          calories += item;

          if (visualization)
            visLineIndex++;
        }

        maxCalories[0] = Math.max (maxCalories[0], calories);
        maxCalories.sort((x, y) => x - y);

        if (visualization) {
          visConsole.lines[visLineIndex - 1].classList.add("underlined");
          visConsole.lines[visLineIndex].innerHTML = calories;
          visConsole.lines[visLineIndex].classList.add("highlighted");
          visLineIndex += 2;
        }
      }

      solConsole.addLine(`Max Calories: ${maxCalories.join(", ")}.`);

      return maxCalories.reduce ((acc, e) => acc + e);
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