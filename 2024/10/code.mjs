import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

const trailheadColorIndex = 10;
const trailheadColor = "#ffff00";
const trailColorIndex = 11;
const trailColor = "#ffffff";

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

    let map = input.trim().split(/\r?\n/).map((line, index, lines) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);
      if (!/^[0-9]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return line.split("").map(e => parseInt(e));
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds the sum of the trailhead scores (part 1) or ratings (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of the trailhead scores (part 1) or ratings (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let heightMap = this.parse(input);
      let mapWidth = heightMap[0].length;
      let mapHeight = heightMap.length;
      let trailheads = [];
      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          if (heightMap[y][x] == 0)
            trailheads.push(new Vector2D(x, y));
        }
      }

      let solConsole = this.solConsole;

      let pixelMap = new PixelMap(mapWidth, mapHeight);

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        for (let i = 1; i < 10; i++)
          pixelMap.palette[i] = `rgb(0, ${i * 25}, 0)`;
        pixelMap.palette[trailheadColorIndex] = trailheadColor;
        pixelMap.palette[trailColorIndex] = trailColor;

        pixelMap.draw(heightMap);
        for (let trailhead of trailheads)
          pixelMap.drawPixel(trailhead.x, trailhead.y, trailheadColorIndex);
      }

      let trailMap = heightMap.map(line => line.map(e => null));

      let solConsoleLine = solConsole.addLine();
      let sum = 0;

      for (let trailheadIndex = 0; trailheadIndex < trailheads.length; trailheadIndex++) {
        if (this.isStopping)
          return;

        // Find all trails
        let trails = this.findTrails(trailheads[trailheadIndex], heightMap, trailMap);

        // Calculate trailhead score (part 1)
        if (part == 1) {
          let trailheadScore = new Set(trails.map(trail => trail[trail.length - 1].y * mapWidth + trail[trail.length - 1].x)).size;
          sum += trailheadScore;
          solConsoleLine.innerHTML = `Sum of trailhead scores: ${sum}.`;
        }
        // Calculate trailhead rating (part 2)
        else {
          let trailheadRating = trails.length;
          sum += trailheadRating;
          solConsoleLine.innerHTML = `Sum of trailhead ratings: ${sum}.`;
        }

        if (visualization) {
          for (let trail of trails) {
            for (let position of trail)
              pixelMap.drawPixel(position.x, position.y, trailColorIndex);
          }
          
          await delay(1);

          for (let trail of trails) {
            for (let position of trail)
              pixelMap.drawPixel(position.x, position.y, heightMap[position.y][position.x]);
          }
        }
      }

      return sum;
    }

    finally {
      this.isSolving = false;
    }
  }

  /**
   * Finds all trails from the specified position and adds them to the trail map.
   * @param {Vector2D} position Position.
   * @param {number[][]} heightMap Height map.
   * @param {Vector2D[][][][]} trailMap Trail map.
   * @returns {Vector2D[][]} Trails.
   */
  findTrails(position, heightMap, trailMap) {
    let nextPositions = [
      position.clone().add(new Vector2D(1, 0)),
      position.clone().add(new Vector2D(-1, 0)),
      position.clone().add(new Vector2D(0, 1)),
      position.clone().add(new Vector2D(0, -1))
    ].filter(p => p.x >= 0 && p.x < heightMap[0].length && p.y >= 0 && p.y < heightMap.length && heightMap[p.y][p.x] == heightMap[position.y][position.x] + 1);

    let trails = [];
    for (let nextPosition of nextPositions) {
      if (heightMap[nextPosition.y][nextPosition.x] == 9)
        trails.push([nextPosition]);
      else {
        for (let trail of (trailMap[nextPosition.y][nextPosition.x] == null ? this.findTrails(nextPosition, heightMap, trailMap) : trailMap[nextPosition.y][nextPosition.x]))
          trails.push([nextPosition].concat(...trail));
      }
    }

    trailMap[position.y][position.x] = trails;
    return trails;
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