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
   * @returns {DanceMove[]} Dance moves.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let danceMoves = input.trim().split(",").map((line, index) => {
      let match;
      if ((match = line.match(/^s(\d+)$/)) != null)
        return new DanceMove("s", [parseInt(match[1])]);
      if ((match = line.match(/^x(\d+)\/(\d+)$/)) != null)
        return new DanceMove("x", [parseInt(match[1]), parseInt(match[2])]);
      if ((match = line.match(/^p([a-z])\/([a-z])$/)) != null)
        return new DanceMove("p", [match[1], match[2]]);
      throw new Error(`Invalid move ${index + 1}`);
    });

    consoleLine.innerHTML += " done.";
    return danceMoves;
  }


  /**
   * Finds the order of the programs after the specified number of dances.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string} Order of the programs after the specified number of dances.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let danceMoves = this.parse(input);
      let programs = new Array(danceMoves.length > 10 ? 16 : 5).fill(null).map((e, i) => String.fromCharCode("a".charCodeAt(0) + i));
      let numberOfDances = part == 1 ? 1 : (danceMoves.length > 10 ? 1000000000 : 2);

      let solConsoleLine;
      let visConsole = new Console();
      if (visualization) {
        solConsoleLine = this.solConsole.addLine();
        this.visContainer.append(visConsole.container);
        visConsole.addLine(programs.join(""));
      }

      let programsDanceNumberMap = new Map();
      let cycleFound = false;
      for (let danceNumber = 1; danceNumber <= numberOfDances; danceNumber++) {
        for (let danceMoveIndex = 0; danceMoveIndex < danceMoves.length; danceMoveIndex++) {
          if (this.isStopping)
            return;

          let danceMove = danceMoves[danceMoveIndex];
          if (danceMove.move == "s") {
            let n = danceMove.parameters[0] % programs.length;
            programs = [...programs.slice(programs.length - n), ...programs.slice(0, programs.length - n)];
          }
          else if (danceMove.move == "x") {
            let i1 = danceMove.parameters[0], i2 = danceMove.parameters[1];
            let p1 = programs[i1], p2 = programs[i2];
            programs[i1] = p2;
            programs[i2] = p1;
          }
          else if (danceMove.move == "p") {
            let p1 = danceMove.parameters[0], p2 = danceMove.parameters[1];
            let i1 = programs.indexOf(p1), i2 = programs.indexOf(p2);
            programs[i1] = p2;
            programs[i2] = p1;
          }

          if (visualization && (danceMoveIndex == danceMoves.length - 1 || (danceMoveIndex + 1) % 1000 == 0)) {
            solConsoleLine.innerHTML = `Dance ${danceNumber}, move ${danceMoveIndex + 1}/${danceMoves.length}.`;
            visConsole.lines[0].innerHTML = programs.join("");
            await delay(1);
          }
        }

        // After each dance check if the same program order has already been encountered before
        if (!cycleFound) {
          let programString = programs.join("");
          let previousDanceNumber = programsDanceNumberMap.get(programString);

          if (previousDanceNumber != undefined) {
            if (visualization)
              this.solConsole.addLine(`Program order after dance ${danceNumber} is the same as after dance ${previousDanceNumber}.`);
            danceNumber = previousDanceNumber + Math.floor((numberOfDances - previousDanceNumber) / (danceNumber - previousDanceNumber)) * (danceNumber - previousDanceNumber);
            if (visualization) {
              this.solConsole.addLine(`It will also be the same after dance ${danceNumber}.`);
              if (danceNumber < numberOfDances)
                solConsoleLine = this.solConsole.addLine();
            }
            cycleFound = true;
          }
          programsDanceNumberMap.set(programString, danceNumber);
        }
      }

      return programs.join("");
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
 * Puzzle dance move class.
 */
class DanceMove {
  /**
   * @param {string} move Move.
   * @param {number|string[]} parameters Parameters.
   */
  constructor(move, parameters) {
    /**
     * Move.
     * @type {string}
     */
    this.move = move;
    /**
     * Parameters.
     * @type {number|string[]}
     */
    this.parameters = parameters;
  }
}