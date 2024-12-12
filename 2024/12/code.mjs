import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

const plotSize = 5;
const fenceColorIndex = 31;
const fenceColor = "#ffffff";

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
   * @returns {number[][]} Map.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let map = [];

    input.trim().split(/\r?\n/).forEach((line, lineIndex) => {
      if (lineIndex != 0 && line.length != map[0].length)
        throw new Error(`Invalid length of line ${lineIndex + 1}`);

      if (!/^[A-Z]+$/.test(line))
        throw new Error(`Invalid data in line ${lineIndex + 1}`);

      map.push(line.split("").map(e => e.charCodeAt(0) - 'A'.charCodeAt(0) + 1));
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds the fencing price.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of the fencing price.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let map = this.parse(input);
      let maxMapValue = map.reduce((acc, line) => Math.max(...line, acc), 0);
      let minMapValue = map.reduce((acc, line) => Math.min(...line, acc), 26);
      let mapWidth = map[0].length;
      let mapHeight = map.length;

      let solConsole = this.solConsole;
      solConsole.addLine(`Map width: ${mapWidth}. Map map height: ${mapHeight}.`);    

      let pixelMap = new PixelMap(mapWidth * plotSize, mapHeight * plotSize);
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        for (let i = minMapValue; i <= maxMapValue; i++)
          pixelMap.palette[i] = `rgb(0, ${(i - minMapValue) / (maxMapValue - minMapValue) * 200 + 50}, 0)`;
        pixelMap.palette[fenceColorIndex] = fenceColor;

        for (let y = 0; y < mapHeight; y++) {
          for (let x = 0; x < mapWidth; x++) {
            for (let i = 0; i < plotSize; i++) {
              for (let j = 0; j < plotSize; j++)
                pixelMap.drawPixel(x * plotSize + j, y * plotSize + i, map[y][x]);
            }
          }
        }
      }

      let solConsoleLine = solConsole.addLine();

      let fillPixelMap = new PixelMap(mapWidth, mapHeight);
      fillPixelMap.draw(map);
      let nonFilledArea = mapWidth * mapHeight;
      let price  = 0;

      for(let fillIndex = -1; nonFilledArea > 0; fillIndex--) {
        let x;
        // Fill area
        let y = fillPixelMap.image.findIndex(row => (x = row.findIndex(p => p > 0)) >= 0);
        fillPixelMap.fill(x, y, fillIndex);

        let area = 0;
        let fences = [];
        // Find fences
        for (let y = 0; y < mapHeight; y++) {
          for (let x = 0; x < mapWidth; x++) {
            if (fillPixelMap.image[y][x] == fillIndex) {
              area++;
              nonFilledArea--;
              if (x == 0 || fillPixelMap.image[y][x - 1] != fillIndex)
                fences.push(new Fence(new Vector2D(x, y), new Vector2D(x, y + 1), new Vector2D(1, 0)));
              if (x == mapWidth - 1 || fillPixelMap.image[y][x + 1] != fillIndex)
                fences.push(new Fence(new Vector2D(x + 1, y), new Vector2D(x + 1, y + 1), new Vector2D(-1, 0)));
              if (y == 0 || fillPixelMap.image[y - 1][x] != fillIndex)
                fences.push(new Fence(new Vector2D(x, y), new Vector2D(x + 1, y), new Vector2D(0, 1)));
              if (y == mapHeight - 1 || fillPixelMap.image[y + 1][x] != fillIndex)
                fences.push(new Fence(new Vector2D(x, y + 1), new Vector2D(x + 1, y + 1), new Vector2D(0, -1)));
            }
          }
        }

        // Merge fences (for part 2)
        let mergingPoints = [];
        for (let fence of fences) {
          for (let point of [fence.start, fence.end]) {
            if (mergingPoints.findIndex(p => p.equals(point)) < 0)
              mergingPoints.push(point);
          }
        }
        for (let mergingPoint of mergingPoints) {
          let fencesToMerge = fences.filter(f => f.start.equals(mergingPoint) || f.end.equals(mergingPoint));
          if (fencesToMerge.length == 2 && fencesToMerge[0].isHorizontal == fencesToMerge[1].isHorizontal) {
            fencesToMerge[0].mergeWith(fencesToMerge[1]);
            fences.splice(fences.indexOf(fencesToMerge[1]), 1);
          }
        }

        // Order fences (for visualization)
        let orderedFences = [[]];
        while (fences.length > 0) {
          let lastFence;
          if (orderedFences[orderedFences.length - 1].length == 0)
            orderedFences[orderedFences.length - 1].push(lastFence = fences.shift());
          else
            lastFence = orderedFences[orderedFences.length - 1][orderedFences[orderedFences.length - 1].length - 1];

          let nextFences = fences.filter(fence => fence.start.equals(lastFence.end) || fence.end.equals(lastFence.end)).map(fence => {
            if (!fence.start.equals(lastFence.end)) {
              let start = fence.start;
              let end = fence.end;
              fence.start = end;
              fence.end = start;
              fence.direction.x = -fence.direction.x;
              fence.direction.y = -fence.direction.y;
            }
            return fence;
          });

          if (nextFences.length > 1)
            nextFences = nextFences.filter(fence => lastFence.end.clone().subtract(lastFence.direction).add(lastFence.inDirection).equals(
              fence.start.clone().add(fence.direction).add(fence.inDirection)));
          
          if (nextFences.length == 0) {
            orderedFences.push([])
          }
          else {
            orderedFences[orderedFences.length - 1].push(nextFences[0]);
            fences.splice(fences.indexOf(nextFences[0]), 1);
          }
        }

        // Visualize and calculate the price
        for (let fences of orderedFences) {
          for (let i = 0; i < fences.length; i++) {
            if (this.isStopping)
              return;
  
            let fence = fences[i];
            if (visualization) {
              let start = fence.start.clone().multiply(plotSize);
              let end = fence.end.clone().multiply(plotSize);
              let direction = fence.direction;
              let inDirection = fence.inDirection;
              let nextFence = fences[(i + 1) % fences.length];
              let previousFence = fences[(i + fences.length - 1) % fences.length];
              let startCornerIsInner = previousFence.direction.clone().subtract(direction).equals(inDirection.clone().add(previousFence.inDirection));
              let endCornerIsInner = direction.clone().subtract(nextFence.direction).equals(inDirection.clone().add(nextFence.inDirection));
  
              if (inDirection.equals(new Vector2D(0, -1)) || inDirection.equals(new Vector2D(-1, 0))) {
                start.add(inDirection);
                end.add(inDirection);
              }
              if (direction.x > 0 || direction.y > 0)
                end.subtract(direction);
              else
                start.add(direction);
  
              if (endCornerIsInner)
                end.add(direction);
              else
                end.subtract(direction);
  
              for (let point = start.clone(); !point.equals(end.clone().add(direction)); point.add(direction)) {
                pixelMap.drawPixel(point.x, point.y, 0);
                if (point.equals(start) && startCornerIsInner)
                  pixelMap.drawPixel(point.x + inDirection.x - direction.x, point.y + inDirection.y - direction.y, fenceColorIndex);  
                if (!point.equals(start) || startCornerIsInner)
                  pixelMap.drawPixel(point.x + inDirection.x, point.y + inDirection.y, fenceColorIndex);
                if (point.equals(end) && endCornerIsInner)
                  pixelMap.drawPixel(point.x + inDirection.x + direction.x, point.y + inDirection.y + direction.y, fenceColorIndex);  
              }

              await delay(1);
            }
  
            price += (part == 1 ? area * fence.end.clone().subtract(fence.start).abs() : area);
            solConsoleLine.innerHTML = `Price: ${price}`;
          }
        }
      }

      return price;
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
 * Puzzle fence class.
 */
class Fence {
  /**
   * @param {Vector2D} start Start.
   * @param {Vector2D} end End.
   * @param {Vector2D} inDirection Direction inside the area.
   */
  constructor(start, end, inDirection) {
    /**
     * Start.
     * @type {Vector2D}
     */
    this.start = start;
    /**
     * End.
     * @type {Vector2D}
     */
    this.end = end;
    /**
     * Direction
     * @type {Vector2D}
     */
    this.direction = end.clone().subtract(start).normalize();
    /**
     * Direction inside the area.
     * @type {Vector2D}
     */
    this.inDirection = inDirection;
    /**
     * True if the fence is horizontal.
     * @type {boolean}
     */
    this.isHorizontal = start.y == end.y;
  }

  /**
   * Merges the fence with another fence.
   * @param {Fence} fence Fence.
   */
  mergeWith(fence) {
    if (this.isHorizontal == fence.isHorizontal) {
      if (this.start.equals(fence.start)) {
        this.start = fence.end.clone();
        return;
      }
      if (this.start.equals(fence.end)) {
        this.start = fence.start.clone();
        return;
      }
      if (this.end.equals(fence.start)) {
        this.end = fence.end.clone();
        return;
      }
      if (this.end.equals(fence.end)) {
        this.end = fence.start.clone();
        return;
      }
    }

    throw new Error(`Fence merge failed`);
  }
}