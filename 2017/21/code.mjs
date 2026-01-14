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
   * @returns {EnhancementRule[]} Enhancement rules.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let enhancementRules = input.split(/\r?\n/).map((line, index) => {
      let match = line.match(/^([\.\/#]+) => ([\.\/#]+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      
      let from = match[1].split("/").map(e => e.split("").map(e => e == "#" ? 1 : 0));
      let to = match[2].split("/").map(e => e.split("").map(e => e == "#" ? 1 : 0));

      let flip = shape => shape.map((e1, y) => shape[0].map((e2, x) => shape[y][shape[0].length - 1 - x]));
      let rotate = shape => shape[0].map((e1, x) => shape.map((e2, y) => shape[shape.length - 1 - y][x]));

      if ((from.length == 2 && from.every(e => e.length == 2) && to.length == 3 && to.every(e => e.length == 3))
        || (from.length == 3 && from.every(e => e.length == 3) && to.length == 4 && to.every(e => e.length == 4))) {
        return new EnhancementRule([from, rotate(from), rotate(rotate(from)), rotate(rotate(rotate(from))),
          flip(from), rotate(flip(from)), rotate(rotate(flip(from))), rotate(rotate(rotate(flip(from))))], to)
      }
      else
        throw new Error(`Invalid data in line ${index + 1}`);
    });

    consoleLine.innerHTML += " done.";
    return enhancementRules;
  }

  /**
   * Finds the number of pixels that stay on after the specified number of iterations.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of pixels that stay on after the specified number of iterations.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let enhancementRules = this.parse(input);
      let image = [[0, 1, 0], [0, 0, 1], [1, 1, 1]];
      let numberOfIterations = enhancementRules.length < 5 ? 2 : (part == 1 ? 5 : 18);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      for (let i = 0; i < numberOfIterations; i++) {
        let imageSize = image.length;
        let fromBlockSize = imageSize % 2 == 0 ? 2 : 3;
        let toBlockSize = imageSize % 2 == 0 ? 3 : 4;
        let newImageSize = imageSize % 2 == 0 ? imageSize / 2 * 3 : imageSize / 3 * 4;
        let newImage = new Array(newImageSize).fill(null).map(e => e = new Array(newImageSize).fill(0));

        for (let x = 0; x < imageSize / fromBlockSize; x++) {
          for (let y = 0; y < imageSize / fromBlockSize; y++) {
            for (let enhancementRuleIndex = 0, enhancementRuleApplied = false; enhancementRuleIndex < enhancementRules.length && !enhancementRuleApplied; enhancementRuleIndex++) {
              let enhancementRule = enhancementRules[enhancementRuleIndex]
              let to = enhancementRule.to;
              if (to.length == toBlockSize) {
                for (let fromIndex = 0; fromIndex < enhancementRule.from.length && !enhancementRuleApplied; fromIndex++) {
                  let from = enhancementRule.from[fromIndex];
                  if (from.length == fromBlockSize) {
                    let match = true;
                    for (let ix = 0; ix < fromBlockSize && match; ix++) {
                      for (let iy = 0; iy < fromBlockSize && match; iy++) {
                        if (from[iy][ix] != image[y * fromBlockSize + iy][x * fromBlockSize + ix])
                          match = false;
                      }
                    }
                    if (match) {
                      for (let ix = 0; ix < toBlockSize; ix++) {
                        for (let iy = 0; iy < toBlockSize; iy++)
                          newImage[y * toBlockSize + iy][x * toBlockSize + ix] = to[iy][ix];
                      }
                      enhancementRuleApplied = true;
                    }
                  }
                }
              }
            }
          }
        }

        image = newImage;

        if (visualization) {
          let numberOfOnPixels = image.reduce((acc, e) => acc + e.reduce((acc, e) => acc + e, 0), 0);
          visConsole.addLine(`Iteration ${i + 1}: ${numberOfOnPixels} pixel${numberOfOnPixels == 1 ? "" : "s"} are on.`);
        }
      }

      return image.reduce((acc, e) => acc + e.reduce((acc, e) => acc + e, 0), 0);
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
 * Puzzle particle class.
 */
class EnhancementRule {
  /**
   * @param {number[][][]} from From.
   * @param {number[][]} to To.
   */
  constructor(from, to) {
    /**
     * From.
     * @type {number[][]}
     */
    this.from = from;
    /**
     * To.
     * @type {number[][]}
     */
    this.to = to;
  }
}