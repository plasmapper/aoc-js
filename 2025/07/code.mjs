import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

const beamColorIndex = 1;
const beamColor = "#ffffff";
const splitterColorIndex = 2;
const splitterColor = "#00aa00";
const tileSize = 3;
const tileCenter = Math.floor(tileSize / 2);

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
   * @returns {{
   * startPoistion: Vector2D,
   * map: number[][]
   * }} Start position and map.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let startPoistion;
    let map = input.trim().split(/\r?\n/).map((line, index, lines) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);
      if (index == 0) {
        if (!/^\.*S\.*$/.test(line))
          throw new Error(`Invalid data in line ${index + 1}`);
        startPoistion = new Vector2D(line.indexOf("S"), 0);
      }
      else if (!/^[\.\^]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return line.split("").map(e => e == "^" ? splitterColorIndex : 0);
    });

    consoleLine.innerHTML += " done.";
    return {startPoistion, map};
  }

  /**
   * Finds the number of times the beam splits (part 1) or the number of timelines (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of times the beam splits (part 1) or the number of timelines (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {startPoistion, map} = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;

      let solConsoleLine;
      let pixelMap = new PixelMap(mapWidth * tileSize, mapHeight * tileSize);

      if (visualization) {
        let solConsole = this.solConsole;
        solConsoleLine = solConsole.addLine();

        this.visContainer.append(pixelMap.container);
        pixelMap.palette[beamColorIndex] = beamColor;
        pixelMap.palette[splitterColorIndex] = splitterColor;

        map.forEach((line, y) => line.forEach((e, x) => {
          if (e) {
            for (let iy = tileCenter; iy < tileSize; iy++) {
              for (let ix = tileCenter - (iy - tileCenter); ix <= tileCenter + (iy - tileCenter); ix++)
                pixelMap.drawPixel(x * tileSize + ix, y * tileSize + iy, splitterColorIndex);
            }
          }
        }));

        for (let iy = 0; iy < tileSize; iy++)
          pixelMap.drawPixel(startPoistion.x * tileSize + tileCenter, iy, beamColorIndex);
      }

      let beams = [new Beam(startPoistion.x, 1)];
      let numberOfSplits = 0, numberOfTimelines = 0;
      for (let y = 1; y < mapHeight; y++) {
        if (this.isStopping)
          return;

        let newBeamGroups = [];
        for (let beam of beams) {
          let x = beam.x;
          if (map[y][x] == 0)
            newBeamGroups.push([new Beam(x, beam.numberOfTimelines)]);
          else {
            numberOfSplits++;
            newBeamGroups.push([
              new Beam(x - 1, beam.numberOfTimelines, x <= 0 || map[y][x - 1] != 0),
              new Beam(x + 1, beam.numberOfTimelines, x >= mapWidth - 1 || map[y][x + 1] != 0)
            ]);
          }
        }

        beams = [];
        for (let newBeamGroup of newBeamGroups) {
          for (let newBeam of newBeamGroup) {
            if (!newBeam.doesNotPropagate) {
              if (beams.length == 0 || beams[beams.length - 1].x != newBeam.x)
                beams.push(newBeam);
              else
                beams[beams.length - 1].numberOfTimelines += newBeam.numberOfTimelines;
            }
          }
        }

        numberOfTimelines = beams.reduce((acc, e) => acc + e.numberOfTimelines, 0);

        if (visualization) {
          solConsoleLine.innerHTML = `Number of ${part == 1 ? "times the beam splits" : "timelines"}: ${part == 1 ? numberOfSplits : numberOfTimelines}.`;

          for (let t = 0; t < tileSize; t++) {
            for (let newBeamGroup of newBeamGroups) {
              if (newBeamGroup.length == 1)
                pixelMap.drawPixel(newBeamGroup[0].x * tileSize + tileCenter, y * tileSize + t, beamColorIndex);
              else {
                if (t < tileCenter)
                  pixelMap.drawPixel((newBeamGroup[0].x + 1) * tileSize + tileCenter, y * tileSize + t, beamColorIndex);
                else {
                  if (pixelMap.image[y * tileSize + t][(newBeamGroup[0].x + 1) * tileSize + tileCenter - (t - tileCenter + 1)] == 0)
                    pixelMap.drawPixel((newBeamGroup[0].x + 1) * tileSize + tileCenter - (t - tileCenter + 1), y * tileSize + t, beamColorIndex);
                  if (pixelMap.image[y * tileSize + t][(newBeamGroup[1].x - 1) * tileSize + tileCenter + (t - tileCenter + 1)] == 0)
                    pixelMap.drawPixel((newBeamGroup[1].x - 1) * tileSize + tileCenter + (t - tileCenter + 1), y * tileSize + t, beamColorIndex);
                }
              }                
            }
            await delay(10);
          }
        }
      }

      return part == 1 ? numberOfSplits : numberOfTimelines;
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
 * Puzzle beam class.
 */
class Beam {
  /**
   * @param {number} x X.
   * @param {number} numberOfTimelines Number of timelines.
   * @param {boolean} doesNotPropagate Is true if the beam does not propagate further.
   */
  constructor(x, numberOfTimelines, doesNotPropagate = false) {
    /**
     * X.
     * @type {number}
     */
    this.x = x;
    /**
     * Number of timelines.
     * @type {number}
     */
    this.numberOfTimelines = numberOfTimelines;
    /**
     * Is true if the beam does not propagate further.
     * @type {boolean}
     */
    this.doesNotPropagate = doesNotPropagate;
  }
}