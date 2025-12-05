import { delay, Console, PixelMap, Vector2D, Range2D } from "../../utility.mjs";

const obstacleColorIndex = 1;
const obstacleColor = "#999999";
const pathColorIndex = 2;
const pathColor = "#ffffff";
const startColorIndex = 3;
const startColor = "#00aa00";
const endColorIndex = 4;
const endColor = "#ffff00";

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
   * map: number[][],
   * start: Vector2D,
   * end: Vector2D
   * }} Map, start and end.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let map = input.trim().split(/\r?\n/).map((line, index, lines) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);
      if (((index == 0 || index == lines.length - 1) && !/^#+$/.test(line)) || !/^#[#\.SE]+#$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return line.split("").map(e => e == "#" ? obstacleColorIndex : (e == "S" ? startColorIndex : (e == "E" ? endColorIndex : 0)));
    });

    let starts = map.reduce((acc, line, y) => [...acc, ...[...line.keys()].filter(x => line[x] == startColorIndex).map(x => new Vector2D(x, y))], []);
    if (starts.length == 0)
      throw new Error("Start not found");
    if (starts.length > 1)
      throw new Error("More than one start found");
    let start = starts[0];

    let ends = map.reduce((acc, line, y) => [...acc, ...[...line.keys()].filter(x => line[x] == endColorIndex).map(x => new Vector2D(x, y))], []);
    if (ends.length == 0)
      throw new Error("Start not found");
    if (ends.length > 1)
      throw new Error("More than one start found");
    let end = ends[0];

    consoleLine.innerHTML += " done.";
    return { map, start, end };
  }

  /**
   * Calculates the number of cheats that save at least 100 ps.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of cheats that save at least 100 ps.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let { map, start, end } = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;
      let mapCoordinateRange = new Range2D(0, mapWidth - 1, 0, mapHeight - 1);

      let solConsole = this.solConsole;

      let pixelMap = new PixelMap(mapWidth, mapHeight);
 
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[obstacleColorIndex] = obstacleColor;
        pixelMap.palette[pathColorIndex] = pathColor;
        pixelMap.palette[startColorIndex] = startColor;
        pixelMap.palette[endColorIndex] = endColor;
  
        pixelMap.draw(map);
      }

      let timeMap = [];
      map.forEach(line => timeMap.push(line.map(e => Number.MAX_VALUE)));

      // Find the route and fill the time map
      let routePoints = [];
      let position = end;
      let i = 0;
      for (; !position.equals(start); i++) {
        let x = position.x, y = position.y;
        if (timeMap[y][x] != Number.MAX_VALUE)
          throw new Error("Single route from start to end not found");
        timeMap[y][x] = i;
        routePoints.push(new Vector2D(x, y));

        for (let newPosition of [new Vector2D(x - 1, y), new Vector2D(x + 1, y), new Vector2D(x, y - 1), new Vector2D(x, y + 1)]) {
          let newX = newPosition.x, newY = newPosition.y;
          if (mapCoordinateRange.contains(newPosition) && (map[newY][newX] == 0 || map[newY][newX] == startColorIndex) && timeMap[newY][newX] == Number.MAX_VALUE)
            position = new Vector2D(newX, newY);
        }

        if (!position.equals(start) && !position.equals(end))
          pixelMap.drawPixel(position.x, position.y, pathColorIndex)
      }
      timeMap[start.y][start.x] = i;
      routePoints.push(start);

      // Find the number of cheats
      let maxCheatDistance = part == 1 ? 2 : 20;
      let minCheatTimeSaved = mapWidth < 20 ? 50 : 100;
      let numberOfCheats = 0;;

      for (let cheatStart of routePoints) {
        let cheatEnds = [];
        for (let x = cheatStart.x - maxCheatDistance; x <= cheatStart.x + maxCheatDistance; x++) {
          for (let y = cheatStart.y - maxCheatDistance; y <= cheatStart.y + maxCheatDistance; y++)
            cheatEnds.push(new Vector2D(x, y));          
        }

        cheatEnds = cheatEnds.filter(p => p.x >= 0 && p.x < mapWidth && p.y >= 0 && p.y < mapHeight && (map[p.y][p.x] == 0 || map[p.y][p.x] == endColorIndex));

        for (let cheatEnd of cheatEnds) {
          let distance = Math.abs(cheatEnd.x - cheatStart.x) + Math.abs(cheatEnd.y - cheatStart.y)
          if (distance <= maxCheatDistance) {
            if (timeMap[cheatStart.y][cheatStart.x] - timeMap[cheatEnd.y][cheatEnd.x] - distance >= minCheatTimeSaved)
              numberOfCheats++;
          }
        }
      }

      solConsole.addLine(`Number of cheats that last at most ${maxCheatDistance} picoseconds and save at least ${minCheatTimeSaved} picoseconds: ${numberOfCheats}.`);
      return numberOfCheats;
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