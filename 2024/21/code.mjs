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
   * @returns {string[]} Codes.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let codes = input.trim().split(/\r?\n/).map((line, lineIndex) => {
    if (!/^[0-9A]+$/.test(line))
      throw new Error(`Invalid data in line ${lineIndex + 1}`);
    return line;
  });

  consoleLine.innerHTML += " done.";
  return codes;
}

  /**
   * Calculates the complexity of the codes.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Complexity of the codes.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let codes = this.parse(input);
      let numberOfRobots = part == 1 ? 2 : 25;
      
      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Create keypads
      let numericKeypad = {
        "7": new Vector2D(0, 0), "8": new Vector2D(1, 0), "9": new Vector2D(2, 0),
        "4": new Vector2D(0, 1), "5": new Vector2D(1, 1), "6": new Vector2D(2, 1),
        "1": new Vector2D(0, 2), "2": new Vector2D(1, 2), "3": new Vector2D(2, 2),
                                 "0": new Vector2D(1, 3), "A": new Vector2D(2, 3)
      };
      let directionalKeypad = {
                                 "^": new Vector2D(1, 0), "A": new Vector2D(2, 0),
        "<": new Vector2D(0, 1), "v": new Vector2D(1, 1), ">": new Vector2D(2, 1)
      };

      // Commands (key: directional keypad command string, value: array of sizes with index being the number of intermediate robots)
      let commandSizes = {};

      // Find all possible robot commands to move between keys
      let numericKeypadCommands = {};
      for (let k1 in numericKeypad) {
        numericKeypadCommands[k1] = {};
        for (let k2 in numericKeypad)
          numericKeypadCommands[k1][k2] = this.findCommands(numericKeypad, k1, k2);
      }

      let directionalKeypadCommands = {};
      for (let k1 in directionalKeypad) {
        directionalKeypadCommands[k1] = {};
        for (let k2 in directionalKeypad) {
          let commands = this.findCommands(directionalKeypad, k1, k2);
          directionalKeypadCommands[k1][k2] = commands;
          for (let command of commands)
            commandSizes[command] = [command.length];
        }
      }

      // Find the commands sizes for different number of intermediate robots
      for (let i = 0; i < numberOfRobots; i++) {
        for (let command in commandSizes) {
          let size = 0;
          let key = "A";
          for (let nextKey of command.split("")) {
            size += Math.min(...directionalKeypadCommands[key][nextKey].map(e => commandSizes[e][i]));
            key = nextKey;
          }
          commandSizes[command].push(size);
        }
      }

      // Find code complexities
      let totalComplexity = 0;
      for (let code of codes) {
        let totalSize = 0;
        let numberKey = "A";
        // For every movement on the numeric keypad
        for (let nextNumberKey of code.split("")) {
          // Find command sizes for every possible directional keypad command sequence
          let sizes = []; 
          for (let command of numericKeypadCommands[numberKey][nextNumberKey]) {
            let directionalKey = "A";
            let size = 0;
            // For every movement on the directional keypad
            for (let nextDirectionalKey of command.split("")) {
              // Add the minimum size of such operation in case of the specified number of intermediate robots
              size += Math.min(...directionalKeypadCommands[directionalKey][nextDirectionalKey].map(e => commandSizes[e][numberOfRobots - 1]));
              directionalKey = nextDirectionalKey;
            }
            sizes.push(size);
          }
          // Find the minimum command size
          totalSize += Math.min(...sizes);
          numberKey = nextNumberKey;
        }

        if (visualization)
          visConsole.addLine(`${code}: ${totalSize} button presses.`);

        totalComplexity += totalSize * parseInt(code.substring(0, code.length - 1));
      }

      return totalComplexity;
    }
    
    finally {
      this.isSolving = false;
    }
  }

  /**
   * Finds robot commands to move between keys on the keypad.
   * @param {Object<string, Vector2D>} keyPad Keypad.
   * @param {string} from From key.
   * @param {string} to To key. 
   * @returns {string[]} Commands.
   */
  findCommands(keyPad, from, to) {
    let paths = [from];

    while (!paths.reduce((acc, p) => acc || p.includes(to), false)) {
      let newPaths = [];
      for (let path of paths) {
        let key = path.substring(path.length - 1);
        for (let nextKey in keyPad) {
          if (!path.includes(nextKey) && keyPad[key].clone().subtract(keyPad[nextKey]).abs() == 1)
            newPaths.push(path + nextKey)
        }
      }
      paths = newPaths;
    }

    paths = paths.filter(p => p.includes(to));

    let commands = [];
    for (let path of paths) {
      commands.push("");
      for (let i = 1; i < path.length; i++) {
        let x1 = keyPad[path.charAt(i - 1)].x;
        let y1 = keyPad[path.charAt(i - 1)].y;
        let x2 = keyPad[path.charAt(i)].x;
        let y2 = keyPad[path.charAt(i)].y;
        if (x2 - x1 == 1)
          commands[commands.length - 1] += ">";
        if (x2 - x1 == -1)
          commands[commands.length - 1] += "<";
        if (y2 - y1 == 1)
          commands[commands.length - 1] += "v";
        if (y2 - y1 == -1)
          commands[commands.length - 1] += "^";
      }
      commands[commands.length - 1] += "A";
    }
    
    return commands;
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