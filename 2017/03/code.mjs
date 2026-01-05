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
   * @returns {number} Square number.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    input = input.trim();
    if (!/^\d+$/.test(input))
      throw new Error("Invalid input data")

    let squareNumber = parseInt(input);

    consoleLine.innerHTML += " done.";
    return squareNumber;
  }


  /**
   * Finds the Manhattan distance from the specified square to the center of the spiral (part 1) or the first square value that is larger than the specified value (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Manhattan distance from the specified square to the center of the spiral (part 1) or the first square value that is larger than the specified value (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let puzzleInput = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      if (part == 1) {
        let squareCoordinates = this.squareNumberToCoordinates(puzzleInput);
        if (visualization)
          visConsole.addLine(`Square ${puzzleInput} coordinates relative to the spiral center: (${squareCoordinates.x}, ${squareCoordinates.y}).`);
        return Math.abs(squareCoordinates.x) + Math.abs(squareCoordinates.y);
      }
      else {
        let value = 0;
        let valueMap = new Map();
        for (let i = 1; value <= puzzleInput; i++) {
          let coordinates = this.squareNumberToCoordinates(i);

          if (i == 1)
            value = 1;
          else {
            let neighborsCoordinates = [new Vector2D(coordinates.x - 1, coordinates.y - 1), new Vector2D(coordinates.x, coordinates.y - 1), new Vector2D(coordinates.x + 1, coordinates.y - 1),
                                        new Vector2D(coordinates.x - 1, coordinates.y), new Vector2D(coordinates.x, coordinates.y), new Vector2D(coordinates.x + 1, coordinates.y),
                                        new Vector2D(coordinates.x - 1, coordinates.y + 1), new Vector2D(coordinates.x, coordinates.y + 1), new Vector2D(coordinates.x + 1, coordinates.y + 1)];
            value = 0;
            for (let neighborCoordinates of neighborsCoordinates) {
              let neighborValue = valueMap.get(`${neighborCoordinates.x}|${neighborCoordinates.y}`);
              if (neighborValue != undefined)
                value += neighborValue;
            }
          }

          valueMap.set(`${coordinates.x}|${coordinates.y}`, value);

          if (visualization) {
            visConsole.addLine(`Square ${i}: <span${value > puzzleInput ? " class='highlighted'" : ""}>${value}</span>${value > puzzleInput ? " > " + puzzleInput : ""}.`)
            visConsole.container.scrollTop = visConsole.lines[visConsole.lines.length - 1].offsetTop - visConsole.container.offsetHeight / 2;
          }
        }
        return value;
      }
    }
    
    finally {
      this.isSolving = false;
    }
  }

  /**
   * Calculates the coordinates of the specified square relative to the spiral center.
   * @param {number} squareNumber Square number.
   * @returns {Vector2D} Square coordinates relative to the spiral center.
   */
  squareNumberToCoordinates(squareNumber) {
    if (squareNumber == 1)
      return new Vector2D(0, 0);
    // Numbers of squares in full turns are: 1, 8, 16, 24, 32...
    // Find the turn index from the square number using the arithmetic progression sum formula
    let turnIndex = Math.floor((1 + Math.sqrt(1 + 8 * (squareNumber - 2) / 8)) / 2);
    let squareIndexInTurn = (squareNumber - 2 - turnIndex * (turnIndex - 1) * 8 / 2);
    let sideIndex = Math.floor(squareIndexInTurn / (turnIndex * 2));
    let squareIndexOnTheSide = squareIndexInTurn % (turnIndex * 2);
    if (sideIndex == 0)
      return new Vector2D(turnIndex, turnIndex - 1 - squareIndexOnTheSide);
    else if (sideIndex == 1)
      return new Vector2D(turnIndex - 1 - squareIndexOnTheSide, -turnIndex);
    else if (sideIndex == 2)
      return new Vector2D(-turnIndex, squareIndexOnTheSide - (turnIndex - 1));
    else
      return new Vector2D(squareIndexOnTheSide - (turnIndex - 1), turnIndex);
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