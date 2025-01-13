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
   * @returns {number[]} Weights.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let weights = input.trim().split(/\r?\n/).map((line, index) => {
      if (!/^\d+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return parseInt(line);
    });

    if (weights.reduce((acc, e) => acc + e, 0) % 3 != 0 || weights.reduce((acc, e) => acc + e, 0) % 4 != 0)
      throw new Error(`The sum of weights must be divisible by 3 and 4`);

    consoleLine.innerHTML += " done.";
    return weights;
  }

  /**
   * Finds the quantum entanglement of the first group of packages in the ideal configuration.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Quantum entanglement of the first group of packages in the ideal configuration.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let weights = this.parse(input);
      let numberOfGroups = part == 1 ? 3 : 4;
      let requiredGroupWeight = weights.reduce((acc, e) => acc + e, 0) / numberOfGroups;
     
      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      for (let group1Size = 1; group1Size <= Math.floor(weights.length / numberOfGroups); group1Size++) {
        // Find groups 1 of the smallest possible size
        let groups1 = new Group([], weights).findChildren(requiredGroupWeight, [group1Size]);
        // Sort groups 1 by quantum entanglement
        groups1.sort((g1, g2) => g1.weights.reduce((acc, e) => acc * e, 1) - g2.weights.reduce((acc, e) => acc * e, 1));

        // Find other groups
        for (let group1 of groups1) {
          let children = group1.findChildren(requiredGroupWeight, new Array(numberOfGroups - 1).fill(undefined));
          if (children.length > 0) {
            let group1QuantumEntanglement = group1.weights.reduce((acc, e) => acc * e, 1);
            if (visualization) {
              visConsole.addLine(`Ideal configurations (QE = ${group1QuantumEntanglement}):`);
              visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
              visConsole.addLine();
              group1.print(visConsole);
            }
  
            return group1QuantumEntanglement;
          }
        }
      }

      throw new Error("Solution not found");
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
 * Puzzle group class.
 */
class Group {
  /**
   * @param {number[]} weights Weights.
   * @param {number[]} remainingWeights Remaining weights.
   * @param {Group} parent Parent.
   */
  constructor(weights, remainingWeights, parent = null) {
    /**
     * Weights.
     * @type {number[]}
     */
    this.weights = weights;
    /**
     * Remaining weights.
     * @type {number[]}
     */
    this.remainingWeights = remainingWeights;
    /**
     * Children.
     * @type {Group[]}
     */
    this.children = [];
    /**
     * Children.
     * @type {Group[]}
     */
    this.parent = parent;
  }

  /**
   * Finds children.
   * @param {number} requiredWeight Required child weight.
   * @param {number[]} groupSizes Group sizes.
   * @returns {Group[]} Children.
   */
  findChildren(requiredWeight, groupSizes) {
    let children;

    if (groupSizes[0] != undefined) {
      children = this.findIndexGroups(0, requiredWeight, 0, groupSizes[0]).map(indexGroup =>
        new Group(indexGroup.map(e => this.remainingWeights[e]), this.remainingWeights.filter((e, i) => !indexGroup.includes(i)), this));
    }
    // For groups of undefined size start with the first remaining weight to prevent group duplication
    else {
      children = this.findIndexGroups(this.remainingWeights[0], requiredWeight, 1, groupSizes[0]).map(indexGroup =>
        new Group([this.remainingWeights[0], ...indexGroup.map(e => this.remainingWeights[e])], this.remainingWeights.filter((e, i) => i != 0 && !indexGroup.includes(i)), this));
    }

    groupSizes = groupSizes.slice(1);
    
    if (groupSizes.length > 0) {
      children.forEach(child => child.findChildren(requiredWeight, groupSizes));
      this.children = children.filter(child => child.children.length > 0);
    }            
    else
      this.children = children;
    return this.children;
  }

  /**
   * Finds weight index groups with the specified weight.
   * @param {number} currentWeight Current group weight.
   * @param {number} requiredWeight Required group weight.
   * @param {number} startIndex Start index of the available weight.
   * @param {number} [groupSize] Group size.
   * @returns {number[]} Weight index groups with the specified weight.
   */
  findIndexGroups(currentWeight, requiredWeight, startIndex, groupSize) {
    let indexGroups = [];
    for (let i = startIndex; i < this.remainingWeights.length; i++) {
      if (currentWeight + this.remainingWeights[i] == requiredWeight && (groupSize == 1 || groupSize == undefined))
        indexGroups.push([i]);
      if (currentWeight + this.remainingWeights[i] < requiredWeight && (groupSize > 1 || groupSize == undefined)) {
        for (let indexGroup of this.findIndexGroups(currentWeight + this.remainingWeights[i], requiredWeight, i + 1, groupSize == undefined ? undefined : groupSize - 1))
          indexGroups.push([i, ...indexGroup]);
      }
    }

    return indexGroups;
  }

  /**
   * Prints the group and its children.
   * @param {Console} visConsole Visualization console.
   */
  print(visConsole) {
    if (this.children.length > 0) {
      for (let child of this.children)
        child.print(visConsole);
    }
    else {
      let lines = [this.weights];
      for (let parent = this.parent; parent.weights.length > 0; parent = parent.parent)
        lines.push(parent.weights);
      lines.reverse();
      for (let line of lines)
        visConsole.addLine(line.join(" "));
      visConsole.addLine();
    }
  }
}