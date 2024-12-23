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
   * @returns {{
   * patterns: string[],
   * designs: string[]
   * }} Patterns and designs.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let patterns = [];
  let designs = [];
  
  input.trim().split(/\r?\n/).forEach((line, lineIndex) => {
    if (lineIndex == 0) {
      if (!/^[wubrg]+(, [wubrg]+)*$/.test(line))
        throw new Error("Invalid data in line 1");
      patterns = line.split(", ");
    }
    
    if (lineIndex == 1 && line != "")
      throw new Error("Invalid data in line 2");

    if (lineIndex > 1) {
      if (!/^[wubrg]+$/.test(line))
        throw new Error(`Invalid data in line ${lineIndex + 1}`);
      designs.push(line);
    }
  });

  consoleLine.innerHTML += " done.";
  return { patterns, designs };
}

  /**
   * Calculates the number of possible designs (part 1) or the total number of different ways to make possible designs (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of possible designs (part 1) or the total number of different ways to make possible designs (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let { patterns, designs } = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let designMap = new Map();
      let patternSet = new Set();

      // Sort patterns by size (so that longer patterns can be correctly analyzed for the number of shorter pattern combinations in them)
      patterns.sort((p1, p2) => p1.length - p2.length);

      // Find the number of short pattern combinations in long patterns
      for (let pattern of patterns) {
        this.findNumberOfPatternCombinations(pattern, designMap, patternSet);
        designMap.set(pattern, designMap.get(pattern) + 1);
        patternSet.add(pattern);
      }

      let numberOfPossibleDesigns = 0;      
      let totalNumberOfCombinations = 0;

      // Find the number of pattern combinations in all designs.
      for (let designIndex = 0; designIndex < designs.length; designIndex++) {
        let numberOfCombinations = this.findNumberOfPatternCombinations(designs[designIndex], designMap, patternSet);
        let designIsPossible = numberOfCombinations > 0;
        numberOfPossibleDesigns += designIsPossible ? 1 : 0;
        totalNumberOfCombinations += numberOfCombinations;

        if (visualization) {
          if (part == 1)
            visConsole.addLine(`Design ${designIndex + 1} is${designIsPossible ? "" : " not"} possible.`);
          else
            visConsole.addLine(`Design ${designIndex + 1}: ${numberOfCombinations} combinations.`);
          
          if (designIsPossible)
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
        }
      }

      if (part == 1)
        return designs.reduce((acc, design) => acc + (designMap.get(design) > 0 ? 1 : 0), 0);
      else
        return designs.reduce((acc, design) => acc + designMap.get(design), 0);
    }
    
    finally {
      this.isSolving = false;
    }
  }

  /**
   * Finds the number of pattern combinations in the design.
   * @param {string} design Design.
   * @param {Map<string, number>} designMap Design map (key: design, value: number of pattern combinations).
   * @param {Set<string>} patternSet Set of patterns.
   * @returns {number} Number of pattern combinations in the design.
   */
  findNumberOfPatternCombinations(design, designMap, patternSet) {
    if (designMap.has(design))
      return designMap.get(design);
    
    // DFS
    let nodeQueue = [new Node(design, null)];
    while(nodeQueue.length) {
      let node = nodeQueue.pop();
      designMap.set(node.design, 0);

      // Separate design into two parts
      for (let i = 1; i < node.design.length; i++) {
        let part1 = node.design.substring(0, i);
        let part2 = node.design.substring(i);

        // If part 1 is a pattern
        if (patternSet.has(part1)) {
          let part2Combinations = designMap.get(part2);
          // If part 2 has already been analyzed, add the number of its combinations to the current and all parent nodes
          if (part2Combinations != undefined) {
            for (let parent = node; parent != null; parent = parent.parent)
              designMap.set(parent.design, designMap.get(parent.design) + part2Combinations);
          }
          // If part 2 is a new design, add it to the queue and set the current node as its parent
          else
            nodeQueue.push(new Node(part2, node));
        }
      }
    }

    return designMap.get(design);
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
 * Puzzle node class.
 */
class Node {
  /**
   * @param {string} design Design.
   * @param {Node} parent Parent.
   */
  constructor(design, parent) {
    /**
     * Design.
     * @type {string}
     */
    this.design = design;
    /**
     * Parent.
     * @type {Node}
     */
    this.parent = parent;
  }
}