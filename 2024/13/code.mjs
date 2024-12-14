import { delay, Console, Vector2D } from "../../utility.mjs";

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
   * @returns {ClawMachine[]} Claw machines.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let clawMachines = [];

  input.trim().split(/\r?\n/).forEach((line, lineIndex) => {
    let match;
    if (lineIndex % 4 == 0) {
      if ((match = line.match(/^Button A: X(\+?\d+), Y(\+?\d+)$/)) == null)
        throw new Error(`Invalid data in line ${index + 1}`);

      clawMachines.push(new ClawMachine(new Vector2D(parseInt(match[1]), parseInt(match[2]))));
    }
    if (lineIndex % 4 == 1) {
      if ((match = line.match(/^Button B: X(\+?\d+), Y(\+?\d+)$/)) == null)
        throw new Error(`Invalid data in line ${index + 1}`);

      clawMachines[clawMachines.length - 1].buttonB = new Vector2D(parseInt(match[1]), parseInt(match[2]));
    }
    if (lineIndex % 4 == 2) {
      if ((match = line.match(/^Prize: X=(\d+), Y=(\d+)$/)) == null)
        throw new Error(`Invalid data in line ${index + 1}`);

      clawMachines[clawMachines.length - 1].prize = new Vector2D(parseInt(match[1]), parseInt(match[2]));
    }
    if (lineIndex % 4 == 3) {
      if (line != "")
        throw new Error(`Invalid data in line ${index + 1}`);
    }
  });

  consoleLine.innerHTML += " done.";
  return clawMachines;
}

  /**
   * Calculates the number of tokens to win all possible prizes.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of tokens to win all possible prizes.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let clawMachines = this.parse(input);

      if (part == 2)
        clawMachines.forEach(clawMachine => { clawMachine.prize.x += 10000000000000; clawMachine.prize.y += 10000000000000; });

      let solConsole = this.solConsole;
      let visConsole = new Console();

      solConsole.addLine(`Number of claw machines: ${clawMachines.length}.`);    

      if (visualization)
        this.visContainer.append(visConsole.container);

      let solConsoleLine = solConsole.addLine();
      let totalNumberOfTokens = 0;

      for (let clawMachineIndex = 0; clawMachineIndex < clawMachines.length; clawMachineIndex++) {
        if (this.isStopping)
          return;

        let clawMachine = clawMachines[clawMachineIndex];
        let x0 = clawMachine.prize.x, y0 = clawMachine.prize.y;
        let x1 = clawMachine.buttonA.x, y1 = clawMachine.buttonA.y;
        let x2 = clawMachine.buttonB.x, y2 = clawMachine.buttonB.y;
        let p1 = 3, p2 = 1;

        // Solution for
        // x0 = x1 * n1 + x2 * n2
        // y0 = y1 * n1 + y2 * n2
        let n1, n2;
        let denominator = (x1 * y2 - x2 * y1);
        // x1 / x2 != y1 / y2
        if (denominator != 0) {
          n1 = (x0 * y2 - x2 * y0) / denominator;
          n2 = (x1 * y0 - x0 * y1) / denominator;
        }
        // x1 / x2 == y1 / y2
        else {
          let xMin = Math.min(x1, x2), yMin = Math.min(y1, y2);
          let xMax = Math.max(x1, x2);
          let nMax = x0 / xMin, nMin = Math.floor(x0 / xMax);
          if (x0 / xMin == y0 / yMin && Number.isInteger(nMax)) {
            if (xMin == x1 && x2 / x1 <= p2 / p1) {
              n1 = nMax;
              n2 = 0;
            }
            else if (xMin == x2 && x1 / x2 <= p1 / p2) {
              n1 = 0;
              n2 = nMax;
            }
            else {
              nMin = Math.floor(x0 / xMax);
              nMax = (x0 - nMin * xMax) / xMin;
              n1 = x1 == xMin ? nMax : nMin;
              n2 = x2 == xMin ? nMax : nMin;
            }
          }
        }
          
        let prizeCanBeReached = (n1 >= 0 && n2 >= 0 && Number.isInteger(n1) && Number.isInteger(n2)) && (part == 2 || (n1 <= 100 && n2 <= 100));
        let numberOfTokens;
        if (prizeCanBeReached) {
          numberOfTokens = n1 * p1 + n2 * p2;
          totalNumberOfTokens += numberOfTokens;
          solConsoleLine.innerHTML = `Claw machine ${clawMachineIndex + 1}: ${numberOfTokens} tokens.\nTotal number of tokens: ${totalNumberOfTokens}.`;
        }
        else
          solConsoleLine.innerHTML = `Claw machine ${clawMachineIndex + 1}: prize can not be reached.\nTotal number of tokens: ${totalNumberOfTokens}.`;

        if (visualization) {
          let visConsoleLine;
          (visConsoleLine = visConsole.addLine()).innerHTML = `Claw machine ${clawMachineIndex + 1}:`;
          if (prizeCanBeReached) {
            visConsoleLine.classList.add("highlighted");
            (visConsoleLine = visConsole.addLine()).innerHTML = `Push A button ${n1} times.`;
            visConsoleLine.classList.add("highlighted");
            (visConsoleLine = visConsole.addLine()).innerHTML = `Push B button ${n2} times.`;
            visConsoleLine.classList.add("highlighted");
            (visConsoleLine = visConsole.addLine()).innerHTML = `Number of tokens: ${numberOfTokens}.`;
            visConsoleLine.classList.add("highlighted");
          }
          else
            visConsole.addLine("Prize can not be reached.");


          visConsole.addLine();
          visConsole.container.scrollTop = visConsole.lines[visConsole.lines.length - 1].offsetTop - visConsole.container.offsetHeight / 2;
          await delay(1);
        }
      }

      return totalNumberOfTokens;
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
 * Puzzle claw machine class.
 */
class ClawMachine {
  /**
   * @param {Vector2D} buttonA Button A coordinate change.
   * @param {Vector2D} buttonB Button B coordinate change.
   * @param {Vector2D} prize Prize location.
   */
  constructor(buttonA, buttonB, prize) {
    /**
     * Button A coordinate change.
     * @type {Vector2D}
     */
    this.buttonA = buttonA;
    /**
     * Button B coordinate change.
     * @type {Vector2D}
     */
    this.buttonB = buttonB;
    /**
     * Prize location.
     * @type {Vector2D}
     */
    this.prize = prize;
  }
}