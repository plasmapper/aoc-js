import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

const wallColorIndex = 1;
const wallColor = "#999999";
const positionColorIndex = 2;
const positionColor = "#ffffff";
const openDoorColorIndex = 3;
const openDoorColor = "#00aa00";

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
    this.isMD5Calculation = true;
  }

  /**
   * Parses the puzzle input.
   * @param {string} input Puzzle input.
   * @returns {string} Passcode.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let line = input.trim();

    consoleLine.innerHTML += " done.";
    return line;
  }

  /**
   * Finds the shortest path to reach the vault (part 1) or the length of the longest path to reach the vault (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string|number} Shortest path to reach the vault (part 1) or the length of the longest path to reach the vault (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let passcode = this.parse(input);
      let gridSize = 4;

      let pixelMap = new PixelMap(gridSize * 2 + 1, gridSize * 2 + 1);
      
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[wallColorIndex] = wallColor;
        pixelMap.palette[positionColorIndex] = positionColor;
        pixelMap.palette[openDoorColorIndex] = openDoorColor;

        for (let x = 0; x < pixelMap.width; x++) {
          for (let y = 0; y < pixelMap.width; y++)
            pixelMap.drawPixel(x, y, (x % 2 == 0 || y % 2 == 0) && !(x >= pixelMap.width - 2 && y >= pixelMap.height - 2) ? wallColorIndex : 0);
        }
      }

      let states = [new State(new Vector2D(0, 0), "")];
      let finalStates = [];

      while (states.length > 0 && (part == 2 || finalStates.length == 0)) {
        let newStates = [];
        for (let state of states) {
          let md5 = CryptoJS.MD5(passcode + state.path);
          if (state.position.y > 0 && ((md5.words[0] & 0xF0000000) >>> 28) > 10) {
            let newState = new State(state.position.clone(), state.path + "U");
            newState.position.y--;
            newStates.push(newState);
          }
          if (state.position.y < (gridSize - 1) && ((md5.words[0] & 0x0F000000) >>> 24) > 10) {
            let newState = new State(state.position.clone(), state.path + "D");
            newState.position.y++;
            if (newState.position.x == gridSize - 1 && newState.position.y == gridSize - 1)
              finalStates.push(newState);
            else
              newStates.push(newState);
          }
          if (state.position.x > 0 && ((md5.words[0] & 0x00F00000) >>> 20) > 10) {
            let newState = new State(state.position.clone(), state.path + "L");
            newState.position.x--;
            newStates.push(newState);
          }
          if (state.position.x < (gridSize - 1) && ((md5.words[0] & 0x000F0000) >>> 16) > 10) {
            let newState = new State(state.position.clone(), state.path + "R");
            newState.position.x++;
            if (newState.position.x == gridSize - 1 && newState.position.y == gridSize - 1)
              finalStates.push(newState);
            else
              newStates.push(newState);
          }
        }

        states = newStates;
      }

      if (finalStates.length == 0)
        throw new Error("Path not found");

      let path = part == 1 ? finalStates[0].path : finalStates[finalStates.length - 1].path;

      if (visualization) {
        let solConsole = this.solConsole;
        solConsole.addLine(`Number of steps: ${path.length}.`);
        let solConsoleLine = solConsole.addLine();

        let position = new Vector2D(0, 0);
        pixelMap.drawPixel(position.x * 2 + 1, position.y * 2 + 1, positionColorIndex);
        await delay(part == 1 ? 200 : 1);
        
        for (let i = 0; i < path.length; i++) {
          if (this.isStopping)
            return;

          let step = path[i];
          let md5 = CryptoJS.MD5(passcode + path.substring(0, i));

          if (position.y > 0 && ((md5.words[0] & 0xF0000000) >>> 28) > 10)
            pixelMap.drawPixel(position.x * 2 + 1, position.y * 2, openDoorColorIndex);
          if (position.y < (gridSize - 1) && ((md5.words[0] & 0x0F000000) >>> 24) > 10)
            pixelMap.drawPixel(position.x * 2 + 1, position.y * 2 + 2, openDoorColorIndex);
          if (position.x > 0 && ((md5.words[0] & 0x00F00000) >>> 20) > 10)
            pixelMap.drawPixel(position.x * 2, position.y * 2 + 1, openDoorColorIndex);
          if (position.x < (gridSize - 1) && ((md5.words[0] & 0x000F0000) >>> 16) > 10)
            pixelMap.drawPixel(position.x * 2 + 2, position.y * 2 + 1, openDoorColorIndex);
          
          await delay(part == 1 ? 200 : 1);

          pixelMap.drawPixel(position.x * 2 + 1, position.y * 2, wallColorIndex);
          pixelMap.drawPixel(position.x * 2 + 1, position.y * 2 + 2, wallColorIndex);
          pixelMap.drawPixel(position.x * 2, position.y * 2 + 1, wallColorIndex);
          pixelMap.drawPixel(position.x * 2 + 2, position.y * 2 + 1, wallColorIndex);
          pixelMap.drawPixel(position.x * 2 + 1, position.y * 2 + 1, 0);
          if (step == "U")
            position.y--;
          if (step == "D")
            position.y++;
          if (step == "L")
            position.x--;
          if (step == "R")
            position.x++;
          pixelMap.drawPixel(position.x * 2 + 1, position.y * 2 + 1, positionColorIndex);

          solConsoleLine.innerHTML = `Step: ${i + 1}.`
          await delay(part == 1 ? 200 : 1);
        }
      }

      return part == 1 ? path : path.length;
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
 * Puzzle state class.
 */
class State {
  /**
   * @param {Vector2D} position Position.
   * @param {string} path Path.
   */
  constructor(position, path) {
    /**
     * Position.
     * @type {Vector2D}
     */
    this.position = position;
    /**
     * Path.
     * @type {string}
     */
    this.path = path;
  }
}