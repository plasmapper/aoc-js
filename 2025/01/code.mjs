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
   * @returns {string} Rotations.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let rotations = input.trim().split(/\r?\n/).map((line, index) => {
      let match = line.match(/^([LR])(\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return (match[1] == "R" ? 1 : -1) * parseInt(match[2]);
    });

    consoleLine.innerHTML += " done.";
    return rotations;
  }

  /**
   * Finds the password from number of zero positions (part 1) or number of zero positions and passes through zero (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Password from number of zero positions (part 1) or number of zero positions and passes through zero (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let rotations = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let dialPosition = 50;
      let numberOfDialPositions = 100;

      if (visualization) 
        visConsole.addLine(`The dial starts by pointing at ${dialPosition}.`);

      let numberOfZeroPositions = 0;
      let totalNumberOfPassesThroughZero = 0;

      for (let rotation of rotations) {
        // Find the number of passes through zero
        let numberPassesThroughZero = 0;
        if (rotation > 0)
          numberPassesThroughZero = Math.floor((dialPosition + rotation - 1) / numberOfDialPositions);
        if (rotation < 0) {
          numberPassesThroughZero = Math.floor((numberOfDialPositions - (dialPosition + rotation) - 1) / numberOfDialPositions);
          if (dialPosition == 0)
            numberPassesThroughZero--;
        }
        totalNumberOfPassesThroughZero += numberPassesThroughZero;

        // Find the new dial position
        dialPosition = ((dialPosition + rotation) % numberOfDialPositions + numberOfDialPositions) % numberOfDialPositions;
        if (dialPosition == 0)
          numberOfZeroPositions++;

        if (visualization) {
          let visualizationLine = `The dial is rotated ${rotation > 0 ? "R" : "L"}${Math.abs(rotation)} to point at `;
          if (dialPosition == 0)
            visualizationLine += `<span class="highlighted">${dialPosition}</span>.`
          else
            visualizationLine += `${dialPosition}.`
          visConsole.addLine(visualizationLine);

          if (part == 2 && numberPassesThroughZero != 0)
            visConsole.addLine(`  Passes through zero <span class="highlighted">${numberPassesThroughZero}</span> time${numberPassesThroughZero > 1 ? "s" : ""}.`);
        }
      }

      return part == 1 ? numberOfZeroPositions : numberOfZeroPositions + totalNumberOfPassesThroughZero;
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