import { delay, Console, PixelMap, Vector2D, Range2D } from "../../utility.mjs";

const positionColorIndex = 1;
const positionColor = "#ffff00";
const pathColorIndex = 2;
const pathColor = "#ffffff";

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
   * @returns {Instruction[]} Instructions.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let instructions = input.trim().split(", ").map((instruction, index) => {
      let match = instruction.match(/^([LR])(\d+)$/);
      if (match == null)
        throw new Error(`Invalid instruction ${index + 1}`);
      return new Instruction(match[1], parseInt(match[2]));
    });

    consoleLine.innerHTML += " done.";
    return instructions;
  }

  /**
   * Finds the distance to the HQ.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Distance to the HQ.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let instructions = this.parse(input);
      
      let position = new Vector2D(0, 0);
      let directions = [new Vector2D(0, -1), new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(-1, 0)];
      let directionIndex = 0;
      let positionSet = new Set(["0|0"]);
      let mapCoordinateRange = new Range2D(0, 0, 0, 0);

      let finalPositionFound = false;
      let path = [position.clone()];
      for (let instructionIndex = 0; instructionIndex < instructions.length && !finalPositionFound; instructionIndex++) {
        if (instructions[instructionIndex].turn == "R")
          directionIndex = (directionIndex + 1) % directions.length;
        else
          directionIndex = (directionIndex - 1 + directions.length) % directions.length;

        for (let stepIndex = 0; stepIndex < instructions[instructionIndex].distance && !finalPositionFound; stepIndex++) {
          position.add(directions[directionIndex]);
          path.push(position.clone());
          mapCoordinateRange.x.from = Math.min(mapCoordinateRange.x.from, position.x);
          mapCoordinateRange.x.to = Math.max(mapCoordinateRange.x.to, position.x);
          mapCoordinateRange.y.from = Math.min(mapCoordinateRange.y.from, position.y);
          mapCoordinateRange.y.to = Math.max(mapCoordinateRange.y.to, position.y);
          
          if (part == 2) {
            let positionString = `${position.x}|${position.y}`;
            if (positionSet.has(positionString))
              finalPositionFound = true;
            positionSet.add(positionString);
          }
        }
      }

      if (visualization) {
        let solConsole = this.solConsole;
        solConsole.addLine(`Number of steps: ${path.length - 1}.`);
        let solConsoleLine = solConsole.addLine();

        let pixelMap = new PixelMap(mapCoordinateRange.x.to - mapCoordinateRange.x.from + 1, mapCoordinateRange.y.to - mapCoordinateRange.y.from + 1);
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[positionColorIndex] = positionColor;
        pixelMap.palette[pathColorIndex] = pathColor;

        for (let i = 1; i < path.length; i++) {
          if (this.isStopping)
            return;

          pixelMap.drawPixel(path[i - 1].x - mapCoordinateRange.x.from, path[i - 1].y - mapCoordinateRange.y.from, pathColorIndex);
          pixelMap.drawPixel(path[i].x - mapCoordinateRange.x.from, path[i].y - mapCoordinateRange.y.from, positionColorIndex);
         
          solConsoleLine.innerHTML = `Step: ${i}.`;

          await delay(1);
        }
      }

      return position.manhattanLength();
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
 * Puzzle instruction class.
 */
class Instruction  {
  /**
   * @param {string} turn Turn.
   * @param {number} distance Distance.
   */
  constructor(turn, distance) {
    /**
     * Turn.
     * @type {string}
     */
    this.turn = turn;
    /**
     * Distance.
     * @type {number}
     */
    this.distance = distance;
  }
}