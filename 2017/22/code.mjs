import { delay, Console, Vector2D, PixelMap } from "../../utility.mjs";

const weakenedColorIndex = 1;
const weakenedColor = "#999999";
const infectedColorIndex = 2;
const infectedColor = "#ff0000";
const flaggedColorIndex = 3;
const flaggedColor = "#00aa00";

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
   * @returns {Vector2D[]} Infected nodes.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let letters = {};
    let map = input.split(/\r?\n/).filter(e => e != "").map((line, index, lines) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);
      if (!/^[#\.]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      return line.split("");
    });

    let mapWidth = map[0].length, mapHeight = map.length;

    if (mapWidth % 2 == 0 || mapHeight % 2 == 0)
      throw new Error("Invalid map size");

    let infectedNodes = [];
    for (let x = 0; x < mapHeight; x++) {
      for (let y = 0; y < mapWidth; y++) {
        if (map[y][x] != ".")
          infectedNodes.push(new Vector2D(x - Math.floor(mapWidth / 2), y - Math.floor(mapHeight / 2)));
      }
    }

    consoleLine.innerHTML += " done.";
    return infectedNodes;
  }

  /**
   * Finds the number of infection bursts.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of infection bursts.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let infectedNodes = this.parse(input);
      let numberOfSteps = part == 1 ? 10000 : 10000000;

      let directions = [new Vector2D(0, -1), new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(-1, 0)];
      let position = new Vector2D(0, 0), directionIndex = 0;
      // Nodes: 1 - weakened, 2 - infected, 3 - flagged
      let nodeMap = infectedNodes.reduce((acc, e) => acc.set(e.y * numberOfSteps * 2 + e.x, 2), new Map());
      let numberOfInfectionBursts = 0;

      let minCoordinates = new Vector2D(Math.min(0, ...infectedNodes.map(e => e.x)), Math.min(0, ...infectedNodes.map(e => e.y)));
      let maxCoordinates = new Vector2D(Math.max(0, ...infectedNodes.map(e => e.x)), Math.max(0, ...infectedNodes.map(e => e.y)));
      infectedNodes.forEach(e => minCoordinates)
      for (let i = 0; i < numberOfSteps; i++) {
        let nodeMapKey = position.y * numberOfSteps * 2 + position.x;
        let nodeValue = nodeMap.get(nodeMapKey);
        if (nodeValue == undefined) {
          if (part == 1) {
            nodeMap.set(nodeMapKey, 2);
            numberOfInfectionBursts++;
          }
          else
            nodeMap.set(nodeMapKey, 1);
          directionIndex = (directionIndex + 3) % directions.length;
        }
        else if (nodeValue == 1) {
          nodeMap.set(nodeMapKey, 2);
          numberOfInfectionBursts++;
        }
        else if (nodeValue == 2) {
          if (part == 1)
            nodeMap.delete(nodeMapKey);
          else
            nodeMap.set(nodeMapKey, 3);
          directionIndex = (directionIndex + 1) % directions.length;
        }
        else if (nodeValue == 3) {
          nodeMap.delete(nodeMapKey);
          directionIndex = (directionIndex + 2) % directions.length;
        }
        position.add(directions[directionIndex]);

        if (visualization) {
          minCoordinates.x = Math.min(minCoordinates.x, position.x);
          minCoordinates.y = Math.min(minCoordinates.y, position.y);
          maxCoordinates.x = Math.max(maxCoordinates.x, position.x);
          maxCoordinates.y = Math.max(maxCoordinates.y, position.y);
        }
      }

      if (visualization) {
        let numberOfInfectionBursts = 0;
        let mapWidth = maxCoordinates.x - minCoordinates.x + 1, mapHeight = maxCoordinates.y - minCoordinates.y + 1;
        this.solConsole.addLine(`Number of steps: ${numberOfSteps}.`);
        let solConsoleLine1 = this.solConsole.addLine();
        let solConsoleLine2 = this.solConsole.addLine();
        let pixelMap = new PixelMap(mapWidth, mapHeight);
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[weakenedColorIndex] = weakenedColor;
        pixelMap.palette[infectedColorIndex] = infectedColor;
        pixelMap.palette[flaggedColorIndex] = flaggedColor;
        for (let infectedNode of infectedNodes)
          pixelMap.drawPixel(infectedNode.x - minCoordinates.x, infectedNode.y - minCoordinates.y, infectedColorIndex);
        let position = new Vector2D(-minCoordinates.x, -minCoordinates.y);
        directionIndex = 0;

        for (let i = 0; i < numberOfSteps; i++) {
          if (this.isStopping)
            return;

          let x = position.x, y = position.y;
          let pixel = pixelMap.image[y][x];
          if (pixel == 0) {
            if (part == 1) {
              pixelMap.drawPixel(x, y, infectedColorIndex);
              numberOfInfectionBursts++;
            }
            else
              pixelMap.drawPixel(x, y, weakenedColorIndex);
            directionIndex = (directionIndex + 3) % directions.length;
          }
          else if (pixel == weakenedColorIndex) {
            pixelMap.drawPixel(x, y, infectedColorIndex);
            numberOfInfectionBursts++;
          }
          else if (pixel == infectedColorIndex) {
            pixelMap.drawPixel(x, y, part == 1 ? 0 : flaggedColorIndex);
            directionIndex = (directionIndex + 1) % directions.length;
          }
          else if (pixel == flaggedColorIndex) {
            pixelMap.drawPixel(x, y, 0);
            directionIndex = (directionIndex + 2) % directions.length;
          }
          position.add(directions[directionIndex]);

          if (visualization) {
            minCoordinates.x = Math.min(minCoordinates.x, position.x);
            minCoordinates.y = Math.min(minCoordinates.y, position.y);
            maxCoordinates.x = Math.max(maxCoordinates.x, position.x);
            maxCoordinates.y = Math.max(maxCoordinates.y, position.y);
          }

          if ((i + 1) % (numberOfSteps / 1000) == 0) {
            solConsoleLine1.innerHTML = `Step: ${i + 1}.`;
            solConsoleLine2.innerHTML = `Infection bursts: ${numberOfInfectionBursts}.`;
            await delay(1);
          }
        }
      }

      return numberOfInfectionBursts;
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