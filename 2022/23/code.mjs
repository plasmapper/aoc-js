import { delay, Console, PixelMap, Vector2D, Range2D } from "../../utility.mjs";

const elfColorIndex = 1;
const elfColor = "#ffffff";

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
   * @returns {Vector2D[]} Elf positions.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let elves = [];
    
    input.trim().split(/\r?\n/).forEach((line, y, lines) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${y + 1}`);
      if (!/^[\.#]+$/.test(line))
        throw new Error(`Invalid data in line ${y + 1}`);
      line.split("").forEach((symbol, x) => {
        if (symbol == "#")
          elves.push(new Vector2D(x, y));
      });
    });

    consoleLine.innerHTML += " done.";
    return elves;
  }

  /**
   * Finds the number empty tiles in the smallest rectangle that contains the Elves (part 1) or the number of the first round where no Elf moves (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number empty tiles in the smallest rectangle that contains the Elves (part 1) or the number of the first round where no Elf moves (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let elves = this.parse(input);

      // Find the smallest rectangle that contains the Elves
      let positionRange = new Range2D(Number.MAX_VALUE, Number.MIN_VALUE, Number.MAX_VALUE, Number.MIN_VALUE);
      for (let elf of elves) {
        positionRange.xRange.from = Math.min(positionRange.xRange.from, elf.x);
        positionRange.xRange.to = Math.max(positionRange.xRange.to, elf.x);
        positionRange.yRange.from = Math.min(positionRange.yRange.from, elf.y);
        positionRange.yRange.to = Math.max(positionRange.yRange.to, elf.y);
      }

      // Expand the map
      let mapExpansionCoefficient = 3;
      let mapWidth = (positionRange.xRange.to - positionRange.xRange.from + 1) * mapExpansionCoefficient;
      let mapHeight = (positionRange.yRange.to - positionRange.yRange.from + 1) * mapExpansionCoefficient;
      let map = [];
      for (let y = 0; y < mapHeight; y++)
        map.push(new Array(mapWidth).fill(0));
      let positionShift = new Vector2D(mapWidth / mapExpansionCoefficient * Math.floor(mapExpansionCoefficient / 2), mapHeight / mapExpansionCoefficient * Math.floor(mapExpansionCoefficient / 2));
      for (let elf of elves) {
        elf.add(positionShift);
        map[elf.y][elf.x] = elfColorIndex;
      }

      let pixelMap = new PixelMap(mapWidth, mapHeight);

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[elfColorIndex] = elfColor;
        pixelMap.draw(map);
      }

      let directions = [new Vector2D(0, -1), new Vector2D(0, 1), new Vector2D(-1, 0), new Vector2D(1, 0)];
      let directionChecks = [
        [new Vector2D(-1, -1), new Vector2D(0, -1), new Vector2D(1, -1)],
        [new Vector2D(-1, 1), new Vector2D(0, 1), new Vector2D(1, 1)],
        [new Vector2D(-1, -1), new Vector2D(-1, 0), new Vector2D(-1, 1)],
        [new Vector2D(1, -1), new Vector2D(1, 0), new Vector2D(1, 1)]
      ];
      let firstDirectionIndex = 0;
      let elvesMoved = true;
      let roundIndex = 0;
      
      for (; elvesMoved && (part == 2 || roundIndex < 10); roundIndex++) {
        if (this.isStopping)
          return;

        // Check if the elf should move
        elvesMoved = false;
        let elfMoves = elves.map(elf =>
          map[elf.y][elf.x + 1] != 0 || map[elf.y + 1][elf.x + 1] != 0 || map[elf.y + 1][elf.x] != 0 || map[elf.y + 1][elf.x - 1] != 0
          || map[elf.y][elf.x - 1] != 0 || map[elf.y - 1][elf.x - 1] != 0 || map[elf.y - 1][elf.x] != 0 || map[elf.y - 1][elf.x + 1] != 0);
        
        // Find new elf position
        let newElves = elves.map((elf, index) => {
          if (elfMoves[index]) {
            for (let i = 0; i < 4; i++) {
              let directionIndex = (firstDirectionIndex + i) % directions.length;
              let positionsToCheck = directionChecks[directionIndex].map(directionCheck => elf.clone().add(directionCheck));
              if (positionsToCheck.reduce((acc, p) => acc && map[p.y][p.x] == 0, true))
                return elf.clone().add(directions[directionIndex]);
            }
            elfMoves[index] = 0;
          }
          return elf;
        });

        // Put new positions on map
        for (let i = 0; i < elves.length; i++) {
          if (elfMoves[i])
            map[newElves[i].y][newElves[i].x]++;
        }

        // Move elf if there is only one candidate for the new position
        for (let i = 0; i < elves.length; i++) {
          if (elfMoves[i]) {
            if (map[newElves[i].y][newElves[i].x] == 1) {
              map[elves[i].y][elves[i].x] = 0;
              elvesMoved = true;
            }
            else {
              map[newElves[i].y][newElves[i].x] = 0;
              newElves[i] = elves[i];
            }
          }
        }

        if (visualization) {
          for (let i = 0; i < elves.length; i++) {
            pixelMap.drawPixel(elves[i].x, elves[i].y, 0);
            pixelMap.drawPixel(newElves[i].x, newElves[i].y, elfColorIndex);
          }
          await delay(1);
        }

        elves = newElves;

        firstDirectionIndex = (firstDirectionIndex + 1) % directions.length;
      }

      // Find the smallest rectangle that contains the Elves
      positionRange = new Range2D(Number.MAX_VALUE, Number.MIN_VALUE, Number.MAX_VALUE, Number.MIN_VALUE);
      for (let elf of elves) {
        positionRange.xRange.from = Math.min(positionRange.xRange.from, elf.x);
        positionRange.xRange.to = Math.max(positionRange.xRange.to, elf.x);
        positionRange.yRange.from = Math.min(positionRange.yRange.from, elf.y);
        positionRange.yRange.to = Math.max(positionRange.yRange.to, elf.y);
      }

      if (part == 1)
        return (positionRange.xRange.to - positionRange.xRange.from + 1) * (positionRange.yRange.to - positionRange.yRange.from + 1) - elves.length;
      else
        return roundIndex;
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