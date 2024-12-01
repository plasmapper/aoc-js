import { delay, Console, PixelMap } from "../../utility.mjs";

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
   * @returns {Tree[][]} Tree array.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let mapWidth = 0;
    let trees = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      if (mapWidth == 0)
        mapWidth = line.length;
      if (line.length != mapWidth)
        throw new Error(`Invalid length of line ${index + 1}`);
      if (!/^\d+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);

      trees.push(line.split("").map(e => new Tree(parseInt(e))));
    });

    consoleLine.innerHTML += " done.";
    return trees;
  }

  /**
   * Counts the number of trees visible from outside the grid (part 1) or finds the highest scenic score (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of trees visible from outside the grid (part 1) or highest scenic score (part 2).
   */
  async solve(part, input, visualization) {
    const treeGreenColorStep = 25;
    const highlightColorIndex = 11;
    const highlightColor = "#ffffff";

    try {
      this.isSolving = true;

      let trees = this.parse(input);
      let mapWidth = trees[0].length;
      let mapHeight = trees.length;

      let solConsole = this.solConsole;
      let pixelMap = new PixelMap(mapWidth, mapHeight);

      solConsole.addLine(`Map width: ${mapWidth}. Map height: ${mapHeight}.`);    

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        for (let i = 1; i <= 10; i++)
          pixelMap.palette[i] = `rgb(0, ${i * treeGreenColorStep}, 0)`;
        pixelMap.palette[highlightColorIndex] = highlightColor;

        pixelMap.draw(trees.map(line => line.map(e => e.height + 1)));
      }

      // Calculate view distances
      for (let y = 0; y < mapHeight; y++)
      {
          for (let x = 0; x < mapWidth; x++)
          {
            let tree = trees[y][x];
            for (; x - tree.viewDistanceLeft > 0 && (tree.viewDistanceLeft == 0 || trees[y][x - tree.viewDistanceLeft].height < trees[y][x].height); tree.viewDistanceLeft++) ;
            for (; x + tree.viewDistanceRight < (mapWidth - 1) && (tree.viewDistanceRight == 0 || trees[y][x + tree.viewDistanceRight].height < trees[y][x].height); tree.viewDistanceRight++) ;
            for (; y - tree.viewDistanceTop > 0 && (tree.viewDistanceTop == 0 || trees[y - tree.viewDistanceTop][x].height < trees[y][x].height); tree.viewDistanceTop++) ;
            for (; y + tree.viewDistanceBottom < (mapHeight - 1) && (tree.viewDistanceBottom == 0 || trees[y + tree.viewDistanceBottom][x].height < trees[y][x].height); tree.viewDistanceBottom++) ;
          }
      }

      // Count the number of trees visible from outside the grid (part 1)
      if (part == 1) {
        let numberOfVisibleTrees = 0;

        for (let y = 0; y < mapHeight; y++)
        {
          for (let x = 0; x < mapWidth; x++)
          {
            if (this.isStopping)
              return 0;

            if (x == 0 || x == mapWidth - 1 || y == 0 || y == mapHeight - 1 ||
                (trees[y][x].viewDistanceLeft == x && trees[y][0].height < trees[y][x].height) ||
                (trees[y][x].viewDistanceRight == mapWidth - x - 1 && trees[y][mapWidth - 1].height < trees[y][x].height) ||
                (trees[y][x].viewDistanceTop == y && trees[0][x].height < trees[y][x].height) ||
                (trees[y][x].viewDistanceBottom == mapHeight - y - 1 && trees[mapHeight-1][x].height < trees[y][x].height)) {
              
              numberOfVisibleTrees++;
            }
            else {
              if (visualization)
                pixelMap.drawPixel(x, y, 0);
            }
          }

          if (visualization) {
            await delay(10);
          }
        }

        return numberOfVisibleTrees;
      }
      // Find the highest scenic score (part 2)
      else {
        let highestScenicScoreX = 0;        
        let highestScenicScoreY = 0;

        for (let y = 0; y < mapHeight; y++)
        {
          for (let x = 0; x < mapWidth; x++)
          {
            if (trees[y][x].scenicScore() > trees[highestScenicScoreY][highestScenicScoreX].scenicScore()) {
              highestScenicScoreY = y;
              highestScenicScoreX = x;
            }
          }
        }

        let tree = trees[highestScenicScoreY][highestScenicScoreX];
        if (visualization) {
          for (let x = highestScenicScoreX - tree.viewDistanceLeft; x <= highestScenicScoreX + tree.viewDistanceRight; x++)
            pixelMap.drawPixel(x, highestScenicScoreY, highlightColorIndex);
          for (let y = highestScenicScoreY - tree.viewDistanceTop; y <= highestScenicScoreY + tree.viewDistanceBottom; y++)
            pixelMap.drawPixel(highestScenicScoreX, y, highlightColorIndex);
        }

        return tree.scenicScore();
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
 * Puzzle tree class.
 */
class Tree {
  /**
   * @param {number} height Tree height.
   */
  constructor(height) {
    /**
     * Tree height.
     * @type {number}
     */
    this.height = height;
    /**
     * Tree view to the left.
     * @type {number}
     */
    this.viewDistanceLeft = 0;
    /**
     * Tree view to the right.
     * @type {number}
     */
    this.viewDistanceRight = 0;
    /**
     * Tree view to the top.
     * @type {number}
     */
    this.viewDistanceTop = 0;
    /**
     * Tree view to the bottom.
     * @type {number}
     */
    this.viewDistanceBottom = 0;
  }

  /**
   * Calculates the scenic score of a tree.
   * @returns {number} Scenic score.
   */
  scenicScore() {
    return this.viewDistanceLeft * this.viewDistanceRight * this.viewDistanceTop * this.viewDistanceBottom;
  }
}