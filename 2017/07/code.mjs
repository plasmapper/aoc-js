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
   * @returns {Program[]} Programs.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let programs = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match = line.match(/^([a-z]+) \((\d+)\)( -> ([a-z]+|, )+)?$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      let program = programs.find(e => e.name == match[1]);
      if (program == undefined)
        programs.push(program = new Program(match[1]));
      program.weight = parseInt(match[2]);
      if (match[3] != undefined) {
        for (let childName of match[3].substring(4).split(", ")) {
          let childProgram = programs.find(e => e.name == childName);
          if (childProgram == undefined)
            programs.push(childProgram = new Program(childName));
          program.children.push(childProgram);
          childProgram.parent = program;
        }
      }
    });

    consoleLine.innerHTML += " done.";
    return programs;
  }


  /**
   * Finds the name of the bottom program (part 1) or the correct weight of the program with the wrong weight (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string|number} Name of the bottom program (part 1) or the correct weight of the program with the wrong weight (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let programs = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let bottomPrograms = programs.filter(e => e.parent == null);
      if (bottomPrograms.length == 0)
        throw new Error("Bottom program not found.");
      if (bottomPrograms.length > 1)
        throw new Error("More than one bottom program found.");
      let bottomProgram = bottomPrograms[0];

      if (part == 1) {
        if (visualization) {
          let drawTree = (program, prefix) => {
            visConsole.addLine(`${prefix}<span${prefix == "" ? " class='highlighted'" : ""}>${program.name}</span> (weight: ${program.weight})`);
            program.children.forEach(child => drawTree(child, prefix + " "));
          }
          drawTree(bottomProgram, "");
        }
        return bottomProgram.name;
      }
      else {
        bottomProgram.calculateTotalWeight();
        bottomProgram.calculateWeightChange(null);
        
        if (bottomProgram.weightChange == null || bottomProgram.weightChange == 0)
          throw new Error("Solution not found");

        if (visualization) {
          let drawTree = (program, prefix) => {
            if (program.weightChange == 0)
              visConsole.addLine(`${prefix}${program.name} (total weight: ${program.totalWeight})`);
            else if (program.children.some(e => e.weightChange != 0)) {
              visConsole.addLine(`${prefix}${program.name} (total weight: ${program.totalWeight}${program.weightChange > 0 ? "+" : "-"}${Math.abs(program.weightChange)}`
              + `=${program.totalWeight + program.weightChange})`);
              program.children.forEach(child => drawTree(child, prefix + " "));
            }
            else {
              visConsole.addLine(`${prefix}${program.name} (total weight: <span class="highlighted">${program.weight}${program.weightChange > 0 ? "+" : "-"}${Math.abs(program.weightChange)}</span>`
              + `+${program.totalWeight - program.weight}=${program.totalWeight + program.weightChange})`);
            }
          }
          drawTree(bottomProgram, "");
        }
        
        let program = bottomProgram;
        for (; program.children.some(e => e.weightChange != 0); program = program.children.find(e => e.weightChange != 0));
        
        return program.weight + program.weightChange;
      }
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
 * Puzzle program class.
 */
class Program {
  /**
   * @param {string} name Name.
   */
  constructor(name) {
    /**
     * Name.
     * @type {string}
     */
    this.name = name;
    /**
     * Weight.
     * @type {number}
     */
    this.weight = 0;
    /**
     * Total weight (with children).
     * @type {number}
     */
    this.totalWeight = 0;
    /**
     * Weight change (to balance the tower).
     * @type {number}
     */
    this.weightChange = null;
    /**
     * Parent.
     * @type {Program}
     */
    this.parent = null;
    /**
     * Children.
     * @type {Program[]}
     */
    this.children = [];
  }

  /**
   * Calculates the total weight of the program and its children.
   * @returns {number} Total weight.
   */
  calculateTotalWeight() {
    this.totalWeight = this.weight + this.children.reduce((acc, e) => acc + e.calculateTotalWeight(), 0);
    return this.totalWeight;
  }

  /**
   * Calculates the change of the weight of the program and its children to balance the tower.
   * @param {number} requiredWeightChange Required weight change (null if any weight change is ok).
   * @returns {number} Weight change (null if not possible).
   */
  calculateWeightChange(requiredWeightChange) {
    // If no children: apply the required weight change to the current program
    if (this.children.length == 0)
      return this.weightChange = requiredWeightChange == null ? 0 : requiredWeightChange;
    // If 1 child:
    else if (this.children.length == 1) {
      let child = this.children[0];
      // If the child can be left unchanged or it's total weight can be changed by the required weight change: apply the required weight change to the current program
      if (child.calculateWeightChange(0) == 0 || child.calculateWeightChange(requiredWeightChange) != null)
        return this.weightChange = requiredWeightChange == null ? 0 : requiredWeightChange;
      else
        return this.weightChange = null;
    }
    // If more than 1 child:
    else {
      this.weightChange = null;
      // For every child:
      for (let childIndex = 0; childIndex < this.children.length && this.weightChange == null; childIndex++) {
        let child = this.children[childIndex];
        let otherChildren = this.children.filter((e, i) => i != childIndex);
        let uniqueOtherChildrenTotalWeights = otherChildren.map(e => e.totalWeight).filter((e, i, arr) => arr.indexOf(e) == i);
        // If other children have the same weight:
        if (uniqueOtherChildrenTotalWeights.length == 1) {
          let requiredChildWeightChange = uniqueOtherChildrenTotalWeights[0] - child.totalWeight;
          // If other children can be left unchanged and current child can be changed to have the same weight as others:
          if (otherChildren.every(e => e.calculateWeightChange(0) == 0) && child.calculateWeightChange(requiredChildWeightChange) != null) {
            // If required weight change is not specified: apply the required child weight change to the current program
            if (requiredWeightChange == null)
              return this.weightChange = requiredChildWeightChange;
            // If required child weight change is 0 or is the same as required weight change: apply the required weight change to the current program
            if (requiredChildWeightChange == 0 || requiredChildWeightChange == requiredWeightChange)
              return this.weightChange = requiredWeightChange;
          }
        }
      }

      return this.weightChange;
    }
  }
}