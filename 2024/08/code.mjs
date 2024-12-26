import { delay, Console, PixelMap, Vector2D, Range2D, greatestCommonDivisor } from "../../utility.mjs";

const antennaColorIndex = 1;
const antennaColor = "#00aa00";
const antinodeColorIndex = 2;
const antinodeColor = "#ffffff";

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
   *   mapWidth: number,
   *   mapHeight: number,
   *   antennas: object.<string, Vector2D[]>
   * }} Map width, height and antennas.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let mapWidth = 0, mapHeight = 0;

    let antennas = input.trim().split(/\r?\n/).reduce((acc, line, y) => {
      if (y == 0)
        mapWidth = line.length;
      if (line.length != mapWidth)
        throw new Error(`Invalid length of line ${y + 1}`);
      if (!/^[\.0-9a-zA-Z]+$/.test(line))
        throw new Error(`Invalid data in line ${y + 1}`);

      [...line.split("").keys()].filter(x => line[x] != ".").forEach(x => {
        if (line[x] in acc)
          acc[line[x]].push(new Vector2D(x, y));
        else
          acc[line[x]] = [new Vector2D(x, y)];
      });

      mapHeight++;
      return acc;
    }, {});

    consoleLine.innerHTML += " done.";
    return {mapWidth, mapHeight, antennas};
  }

  /**
   * Finds the number of antinodes.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of antinodes.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {mapWidth, mapHeight, antennas} = this.parse(input);
      let mapCoordinateRange = new Range2D(0, mapWidth - 1, 0, mapHeight - 1);

      let pixelMap = new PixelMap(mapWidth, mapHeight);

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[antennaColorIndex] = antennaColor;
        pixelMap.palette[antinodeColorIndex] = antinodeColor;

        for (var frequency in antennas) {
          for (let antenna of antennas[frequency])
            pixelMap.drawPixel(antenna.x, antenna.y, antennaColorIndex);
        }
      }

      let allAntinodes = new Set();
      for (var frequency in antennas) {
        if (this.isStopping)
          return;

        let numberOfAntennas = antennas[frequency].length;

        for (let i1 = 0, i2 = 1; i1 < numberOfAntennas - 1; i2++) {
          if (i2 >= numberOfAntennas) {
            i1++;
            i2 = i1;
          }
          else {
            let antenna1 = antennas[frequency][i1];
            let antenna2 = antennas[frequency][i2];
            let antinodes = [];

            // Find antinodes twice as far from one antenna than from the other (part 1)
            if (part == 1) {
              antinodes = [
                antenna2.clone().add(antenna2.clone().subtract(antenna1)),
                antenna1.clone().add(antenna1.clone().subtract(antenna2))
              ].filter(antinode => mapCoordinateRange.contains(antinode));
            }
            
            // Find antinodes in line with antennas (part 2)
            else {
              // Find the smallest direction vector pointing from antenna 1 to antenna 2
              let direction = antenna2.clone().subtract(antenna1);
              let gcd = greatestCommonDivisor(Math.abs(direction.x), Math.abs(direction.y));
              direction.x /= gcd;
              direction.y /= gcd;

              for (let position = antenna1.clone(); mapCoordinateRange.contains(position); position.add(direction))
                antinodes.push(position.clone());
              for (let position = antenna1.clone().subtract(direction); mapCoordinateRange.contains(position); position.subtract(direction))
                antinodes.push(position.clone());
            }

            for (let antinode of antinodes) {
              allAntinodes.add(`${antinode.x},${antinode.y}`);
              if (visualization) {
                if (pixelMap.image[antinode.y][antinode.x] == 0) {
                  pixelMap.drawPixel(antinode.x, antinode.y, antinodeColorIndex);
                  await delay(1);
                }
              }
            }
          }
        }
      }
 
      return allAntinodes.size;
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