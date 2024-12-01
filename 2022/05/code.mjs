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
   * @returns {{stacks: string[][], moveSteps: MoveStep[]}} Crate stacks and move steps.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let stacks = [];
    let moveSteps = [];

    let lines = input.split(/\r?\n/);
    let emptyLineIndex;
    if ((emptyLineIndex = lines.indexOf("")) < 0)
      throw new Error("Empty line not found");
    if (emptyLineIndex == 0)
      throw new Error("Stack numbers not found");
    
    // Create empty stack arrays
    for (let i = 1; i < lines[emptyLineIndex - 1].length; i += 4) {
      if (parseInt(lines[emptyLineIndex - 1][i]) != stacks.length + 1)
        throw new Error(`Invalid data in line ${emptyLineIndex}`);
      stacks.push([]);
    }

    // Fill stack arrays with data
    for (let i = emptyLineIndex - 2; i >= 0; i--) {
      if (lines[i].length > stacks.length * 4)
        throw new Error(`Invalid data in line ${i + 1}`);
      for (let [stackIndex, stack] of stacks.entries()) {
        if (/^\[[A-Z]\]$/.test(lines[i].substring(stackIndex * 4, stackIndex * 4 + 3)))
          stack.push(lines[i][stackIndex * 4 + 1]);
        else {
          if (lines[i].substring(stackIndex * 4, stackIndex * 4 + 3).trim() != "")
            throw new Error(`Invalid data in line ${i + 1}`);
        }
      }
    }

    // Parse moves
    for (let i = emptyLineIndex + 1; i < lines.length; i++) {
      if (lines[i] != "") {
        let match = lines[i].match(/^move (\d+) from (\d+) to (\d+)$/);
        if (match == null || match[1] == 0 || match[2] == 0 || match[3] == 0)
          throw new Error(`Invalid data in line ${i + 1}`);
        if (lines[i] != "")
        moveSteps.push(new MoveStep(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]) - 1)); 
      }         
    }

    consoleLine.innerHTML += " done.";
    return {stacks, moveSteps};
  }

  /**
   * Finds the top crate letters as a string after all move steps.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string} Top crate letters.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;
      
      let stacksAndMoveSteps = this.parse(input);
      let stacks = stacksAndMoveSteps.stacks;
      let moveSteps = stacksAndMoveSteps.moveSteps;
      let multipleCrates = part == 2;

      let solConsole = this.solConsole;
      let visConsole = new Console();
      let image;
  
      solConsole.addLine(`Number of steps: ${moveSteps.length}.`);
      let solConsoleLine = solConsole.addLine();
  
      let originalStacks = stacks;
      stacks = originalStacks.map(stack => stack.slice());
  
      if (visualization) {
        this.visContainer.append(visConsole.container);
  
        let maxHeight = stacks.reduce((acc, e) => Math.max(acc, e.length), 0);
        for (let [stepIndex, step] of moveSteps.entries())
          maxHeight = Math.max(maxHeight, await this.moveCrates (stacks, step, stepIndex, multipleCrates, false));
  
        stacks = originalStacks.map(stack => stack.slice());
    
        visConsole.container.style.width = `${stacks.length * 2.5}em`;
        visConsole.container.style.height = `${(maxHeight + 1) * 1.25}em`;
    
        image = [];
        for (let i = 0; i <= maxHeight; i++)
          image.push(new Array(4 * stacks.length).fill(" "));
        for (let [stackIndex, stack] of stacks.entries()) {
          image[image.length - 1][stackIndex * 4 + 1] = stackIndex + 1;
          for (let [crateIndex, crate] of stack.entries())
            image[image.length - 2 - crateIndex].splice(stackIndex * 4, 3, "[", crate, "]");
        }
      }
  
      for (let [stepIndex, step] of moveSteps.entries()) {
        if (this.isStopping)
          return;
  
        solConsoleLine.innerHTML = `Step ${stepIndex + 1}: move ${step.numberOfCrates} from ${step.source + 1} to ${step.destination + 1}.`;
        await this.moveCrates (stacks, step, stepIndex, multipleCrates, visualization, visConsole, image);
      }     
      
      return stacks.map(stack => stack[stack.length - 1]).join("");
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

  /**
   * Execute one move step.
   * @param {string[][]} stacks Stacks.
   * @param {MoveStep} moveStep Move step description.
   * @param {number} stepIndex Step index.
   * @param {boolean} multipleCrates Move crates as a group and not sequentially.
   * @param {boolean} visualization  Enable visualization.
   * @param {Console} visConsole Visualization console.
   * @param {string[][]} image Visualization image.
   * @returns {number} Maximum height required to display the moving crates.
   */
  async moveCrates (stacks, moveStep, stepIndex, multipleCrates, visualization, visConsole, image) {
    let crateGroupSize = multipleCrates ? moveStep.numberOfCrates : 1;
    let maxHeight = 0;

    for (let i = 0; i < moveStep.numberOfCrates; i += crateGroupSize) {
      if (this.isStopping)
        return 0;

      if (moveStep.source >= stacks.length || moveStep.destination >= stacks.length || stacks[moveStep.source].length < crateGroupSize)
        throw new Error(`Invalid step ${stepIndex + 1}`);

      let movedCrates = stacks[moveStep.source].splice(stacks[moveStep.source].length - crateGroupSize);

      // Calculate the X direction of movement and the required lift of the crates
      let xDir = Math.sign(moveStep.destination - moveStep.source);
      let lift = stacks[moveStep.destination].length;
      for (let i = moveStep.source; i != moveStep.destination; i += xDir)
        lift = Math.max(lift, stacks[i].length);
      maxHeight = Math.max(maxHeight, lift + crateGroupSize);

      if (visualization) {
        this.drawImage(visConsole, image);
        await delay(10);

        let x = moveStep.source * 4 + 1;
        let xEnd = moveStep.destination * 4 + 1;
        let xStep = xDir;
        let y = image.length - 2 - stacks[moveStep.source].length;
        let yEnd = image.length - 2 - stacks[moveStep.destination].length;
        let yTop = image.length - 2 - lift;
        let yStep = 1;

        // Move the crates up
        while (y > yTop) {
          if (this.isStopping)
            return 0;

          let newY = Math.max(yTop, y - yStep);
          this.moveCratesImage(movedCrates, image, x, y, x, newY);
          y = newY;
          this.drawImage(visConsole, image);
          await delay(10);
        }

        // Move the crates to the destination stack
        while (x != xEnd) {
          if (this.isStopping)
            return 0;

          let newX = x + xStep;
          this.moveCratesImage(movedCrates, image, x, y, newX, y);
          x = newX;
          this.drawImage(visConsole, image);
          await delay(10);
        }

        // Move the crates down
        while (y < yEnd) {
          if (this.isStopping)
            return 0;

          let newY = Math.min(yEnd, y + yStep);
          this.moveCratesImage(movedCrates, image, x, y, x, newY);
          y = newY;
          this.drawImage(visConsole, image);
          await delay(10);
        }
      }

      stacks[moveStep.destination].push(...movedCrates);
    }

    return maxHeight;
  }

  /**
   * Draws the visualization image.
   * @param {Console} visConsole Visualization console.
   * @param {string[][]} image Visualization image.
   */
  drawImage (visConsole, image) {
    visConsole.container.innerHTML = image.map(line => line.join("")).join("\r\n");
  }

  /**
   * Moves the crtaes in the image.
   * @param {string[]} movedCrates Moved crates.
   * @param {string[][]} image Visualization image.
   * @param {number} xStart X coordinate of the move start.
   * @param {number} yStart Y coordinate of the move start.
   * @param {number} xEnd X coordinate of the move end.
   * @param {number} yEnd Y coordinate of the move end.
   */
  moveCratesImage (movedCrates, image, xStart, yStart, xEnd, yEnd) {
    for (let [crateIndex] of movedCrates.entries())
      image[yStart - crateIndex].splice(xStart - 1, 3, " ", " ", " ");
    for (let [crateIndex, crate] of movedCrates.entries())
      image[yEnd - crateIndex].splice(xEnd - 1, 3, "[", crate, "]");
  }
}

/**
 * Puzzle move step.
 */
class MoveStep {
  /**
   * @param {number} numberOfCrates Number of crates to move.
   * @param {number} source Source stack index.
   * @param {number} destination Destination stack index.
   */
  constructor (numberOfCrates, source, destination) {
    /**
     * Number of crates to move.
     * @type {number}
     */
    this.numberOfCrates = numberOfCrates;
    /**
     * Source stack index.
     * @type {number}
     */
    this.source = source;
    /**
     * Destination stack index.
     * @type {number}
     */
    this.destination = destination;
  }
}