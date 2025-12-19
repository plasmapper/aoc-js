import { delay, Console, PixelMap, Vector2D, Graph } from "../../utility.mjs";

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
   * @returns {MapBlock[][]} Map.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let map = input.trim().split(/\r?\n/).map((line, index, lines) => {
      if (!/^[0-9]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);
      return line.split("").map(e => parseInt(e));
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds the least heat loss after going through the map.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The least heat loss after going through the map.
   */
  async solve(part, input, visualization) {
    const mapGreenColorStep = 25;
    const highlightColorIndex = 10;
    const highlightColor = "#ffffff";

    try {
      this.isSolving = true;

      let map = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;

      let pixelMap = new PixelMap(mapWidth, mapHeight);
      
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        for (let i = 1; i <= 9; i++)
          pixelMap.palette[i] = `rgb(0, ${i * mapGreenColorStep}, 0)`;
        pixelMap.palette[highlightColorIndex] = highlightColor;
        pixelMap.draw(map);
      }

      let minNumberOfSameDirectionSteps = part == 1 ? 1 : 4;
      let maxNumberOfSameDirectionSteps = part == 1 ? 3 : 10;

      // Create graph
      let graph = new Graph();

      // Create nodes
      let directions = [new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(-1, 0), new Vector2D(0, -1)];
      let nodes = Array.from({length: mapWidth}, (e, x) => Array.from({length: mapHeight},
        (e, y) => directions.map(direction => Array.from({length: maxNumberOfSameDirectionSteps + 1}, (e, numberOfSameDirectionSteps => {
        let node = new Vector2D(x, y);
        graph.addNode(node);
        return node;
      })))));

      // Create edges
      nodes.forEach((e, x) => e.forEach((e, y) => e.forEach((e, directionIndex) => e.forEach((node, numberOfSameDirectionSteps) => {
        [directionIndex, (directionIndex + 1) % directions.length, (directionIndex - 1 + directions.length) % directions.length].forEach((directionIndex, i) => {
          if ((i == 0 && numberOfSameDirectionSteps < maxNumberOfSameDirectionSteps) || (i > 0 && numberOfSameDirectionSteps >= minNumberOfSameDirectionSteps)) {
            let neighborPosition = new Vector2D(x + directions[directionIndex].x, y + directions[directionIndex].y);
            if (neighborPosition.x >= 0 && neighborPosition.x < mapWidth && neighborPosition.y >= 0 && neighborPosition.y < mapHeight)
              graph.addDirectedEdge(node, nodes[neighborPosition.x][neighborPosition.y][directionIndex][i == 0 ? numberOfSameDirectionSteps + 1 : 1], map[neighborPosition.y][neighborPosition.x]);
          }
        });
      }))));

      // Create start and end node edges
      let startNode = new Vector2D(0, 0);
      graph.addNode(startNode);
      graph.addDirectedEdge(startNode, nodes[0][0][0][0], 0);
      graph.addDirectedEdge(startNode, nodes[0][0][1][0], 0);
      let endNode = new Vector2D(mapWidth - 1, mapHeight - 1);
      graph.addNode(endNode);
      for (let i = minNumberOfSameDirectionSteps; i <= maxNumberOfSameDirectionSteps; i++) {
        graph.addDirectedEdge(nodes[mapWidth - 1][mapHeight - 1][0][i], endNode, 0);
        graph.addDirectedEdge(nodes[mapWidth - 1][mapHeight - 1][1][i], endNode, 0);
      }

      // Find the shortest path
      let minHeatLossPath = graph.findShortestPath(startNode, endNode).slice(1, -1);

      if (visualization) {
        for (let node of minHeatLossPath) {
          if (this.isStopping)
            return 0;
          pixelMap.drawPixel(node.x, node.y, highlightColorIndex);
          await delay(1);
        }
      }

      return minHeatLossPath.reduce((acc, node, i, path) => acc + (i == 0 ? 0 : graph.getEdgeWeight(path[i - 1], node)), 0);
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