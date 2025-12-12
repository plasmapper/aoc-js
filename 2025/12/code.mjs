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
    this.noPart2 = true;
  }

  /**
   * Parses the puzzle input.
   * @param {string} input Puzzle input.
   * @returns {{
   *   shapes: number[][][],
   *   regions: Region[],
   * }} Shapes and regions.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let blocks = input.trim().split(/\r?\n\r?\n/);

    let shapes = blocks.slice(0, -1).map((shapeBlock, shapeBlockIndex) => {
      let shapeBlockLines = shapeBlock.trim().split(/\r?\n/);
      if (shapeBlockLines[0] != `${shapeBlockIndex}:`)
        throw new Error(`Invalid index in shape ${shapeBlockIndex}`);

      let shape = shapeBlockLines.slice(1).map((line, lineIndex) => {
        if (line.length != shapeBlockLines[1].length)
          throw new Error(`Invalid length of line ${lineIndex + 2} in shape ${shapeBlockIndex + 1}`);
        if (!/^[\.#]+$/.test(line))
          throw new Error(`Invalid data in line ${lineIndex + 2} in shape ${shapeBlockIndex + 1}`);
        return line.split("").map(e => e == "#" ? 1 : 0);
      });

      let shapeWidth = shape[0].length, shapeHeight = shape.length;

      // Flip
      let flippedShapes = [
        shape,
        shape.map((e1, y) => shape[0].map((e2, x) => shape[y][shapeWidth - 1 - x])),
        shape.map((e1, y) => shape[0].map((e2, x) => shape[shapeHeight - 1 - y][x]))];

      // Rotate
      let flippedAndRotatedShapes = flippedShapes.reduce((acc, flippedShape) => {
        acc.push(flippedShape);
        acc.push(flippedShape[0].map((e1, x) => flippedShape.map((e2, y) => flippedShape[shapeHeight - 1 - y][x])));
        acc.push(flippedShape.map((e1, y) => flippedShape[0].map((e2, x) => flippedShape[shapeHeight - 1 - y][shapeWidth - 1 - x])));
        acc.push(flippedShape[0].map((e1, x) => flippedShape.map((e2, y) => flippedShape[y][shapeWidth - 1 - x])));
        return acc;
      }, []);

      // Return unique shapes
      return flippedAndRotatedShapes.filter((shape1, index) => flippedAndRotatedShapes.findIndex(shape2 =>
        shape1.length == shape2.length
        && shape1[0].length == shape2[0].length
        && shape1.reduce((acc, e1, y) => acc && e1.reduce((acc, e2, x) => acc && shape1[y][x] == shape2[y][x], true), true)) == index);
    });

    let regions = blocks[blocks.length - 1].trim().split(/\r?\n/).map((line, index) => {
      let match = line.match(/^(\d+)x(\d+):(( \d+)+)$/);
      if (match == null)
        throw new Error(`Invalid data in region ${index + 1}`);
      return new Region(parseInt(match[1]), parseInt(match[2]), match[3].trim().split(" ").map(e => parseInt(e)));      
    });

    consoleLine.innerHTML += " done.";
    return {shapes, regions};
  }

  /**
   * Finds the number of regions that can fit the required number of presents.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of regions that can fit the required number of presents.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {shapes, regions} = this.parse(input);
      let maxShapeSize = shapes.reduce((acc, e) => Math.max(e[0].length, e[0][0].length, acc), 0);
      let minShapeAreas = shapes.map(e => e[0].reduce((acc1, e1) => acc1 + e1.reduce((acc2, e2) => acc2 + e2, 0), 0));

      let visConsole = new Console();
      if (visualization) {
        this.visContainer.append(visConsole.container);
        visConsole.addLine("Solution is based on the assumption that every region either definitely fits or definitely does not fit the presents and there is no need to go through all possible arrangements of shapes.");
        visConsole.addLine();
        visConsole.addLine(`Area that fits any shape: ${maxShapeSize}x${maxShapeSize}.`);
        visConsole.addLine();
      }

      let numberOfRegionsThatFitThePresents = 0;
      for (let region of regions) {
        let regionArea = region.width * region.height;
        let minAreaOfPresents = region.presentNumbers.reduce((acc, e, i) => acc + e * minShapeAreas[i], 0);
        let numberOfPresents = region.presentNumbers.reduce((acc, e) => acc + e, 0);
        let numberOfMaxShapeSizeBlocks = Math.floor(region.width / maxShapeSize) * Math.floor(region.height / maxShapeSize);

        let fits = numberOfMaxShapeSizeBlocks >= numberOfPresents;
        let doesNotFit = regionArea < minAreaOfPresents;

        if (visualization) {
          visConsole.addLine(`Region ${region.width}x${region.height}:`)
          visConsole.addLine(`  Area: ${regionArea}.`)
          visConsole.addLine(`  Min area of presents: ${minAreaOfPresents}.`)
          if (doesNotFit) {
            visConsole.lines[visConsole.lines.length - 2].classList.add("error");
            visConsole.lines[visConsole.lines.length - 1].classList.add("error");
          }
          visConsole.addLine(`  Number of presents: ${numberOfPresents}.`)
          visConsole.addLine(`  Number of ${maxShapeSize}x${maxShapeSize} blocks that fit: ${numberOfMaxShapeSizeBlocks}.`)
          if (fits) {
            visConsole.lines[visConsole.lines.length - 2].classList.add("highlighted");
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          }
          visConsole.addLine();
        }

        if (fits)
          numberOfRegionsThatFitThePresents++;
        else if (!doesNotFit)
          throw new Error("Solution not found");
      }

      return numberOfRegionsThatFitThePresents;
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
 * Puzzle region class.
 */
class Region {
  /**
   * @param {number} width Width.
   * @param {number} height Height.
   * @param {number[]} presentNumbers Numbers of presents to fit.
   */
  constructor(width, height, presentNumbers) {
    /**
     * Width.
     * @type {number}
     */
    this.width = width;
    /**
     * Height.
     * @type {number}
     */
    this.height = height;
    /**
     * Numbers of presents to fit.
     * @type {number[]}
     */
    this.presentNumbers = presentNumbers;
  }
}