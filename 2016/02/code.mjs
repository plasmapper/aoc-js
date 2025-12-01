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
   * @returns {string[]} Instructions.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let instructions = input.trim().split(/\r?\n/).map((line, index) => {
      if (!/^[LRUD]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return line;
    });

    consoleLine.innerHTML += " done.";
    return instructions;
  }

  /**
   * Finds the bathroom code.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string} Bathroom code.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let instructions = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let buttons, position;
      if (part == 1) {
        buttons = [[null, null, null, null, null],
                   [null,  1,    2,    3,   null],
                   [null,  4,    5,    6,   null],
                   [null,  7,    8,    9,   null],
                   [null, null, null, null, null]];
        position = new Vector2D(2, 2);
      }
      else {
        buttons = [[null, null, null, null, null, null, null],
                   [null, null, null,  1,   null, null, null],
                   [null, null,  2,    3,    4,   null, null],
                   [null,  5,    6,    7,    8,    9,   null],
                   [null, null, "A",  "B",  "C",  null, null],
                   [null, null, null, "D",  null, null, null],
                   [null, null, null, null, null, null, null]];
        position = new Vector2D(1, 3);
      }
      let password = "";

      if (visualization) 
        visConsole.addLine(`Current button: "${buttons[position.y][position.x]}".`);

      for (let instruction of instructions) {
        for (let movement of instruction) {
          let newPosition = position.clone();
          if (movement == "L")
            newPosition.x = Math.max(0, position.x - 1);
          if (movement == "R")
            newPosition.x = Math.min(buttons[0].length - 1, position.x + 1);
          if (movement == "U")
            newPosition.y = Math.max(0, position.y - 1);
          if (movement == "D")
            newPosition.y = Math.min(buttons.length - 1, position.y + 1);
          
          if (buttons[newPosition.y][newPosition.x] != null)
            position = newPosition;
        }

        password += buttons[position.y][position.x];

        if (visualization) {
          visConsole.addLine();
          visConsole.addLine(instruction);
          visConsole.addLine();
          visConsole.addLine(`Current button: "<span class="highlighted">${buttons[position.y][position.x]}</span>".`);
        }
      }

      return password;
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