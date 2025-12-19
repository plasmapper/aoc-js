import { delay, Console, PixelMap, Vector2D, Graph } from "../../utility.mjs";

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
   * Calculates the lowest path score (part 1) or the number of tiles along the best paths (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Lowest path score (part 1) or the number of tiles along the best paths (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let { map, start, end } = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;

      let pixelMap = new PixelMap(mapWidth, mapHeight);
 
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[obstacleColorIndex] = obstacleColor;
        pixelMap.palette[pathColorIndex] = pathColor;
        pixelMap.palette[startColorIndex] = startColor;
        pixelMap.palette[endColorIndex] = endColor;
  
        pixelMap.draw(map);
      }
      
      // Create graph
      let graph = new Graph();

      // Create nodes
      let directions = [new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(-1, 0), new Vector2D(0, -1)];
      let nodes = Array.from({length: mapWidth}, (e, x) => Array.from({length: mapHeight}, (e, y) => directions.map(direction => {
        if (map[y][x] == obstacleColorIndex)
          return null;
        let node = new Vector2D(x, y);
        graph.addNode(node);
        return node;
      })));

      // Create edges
      nodes.forEach((e, x) => e.forEach((e, y) => {
        if (map[y][x] != obstacleColorIndex) {
          e.forEach((node, directionIndex) => {
            // Add right turn
            graph.addDirectedEdge(node, nodes[x][y][(directionIndex + 1) % directions.length], 1000);
            // Add left turn
            graph.addDirectedEdge(node, nodes[x][y][(directionIndex - 1 + directions.length) % directions.length], 1000);
            // Add forward move
            let forwardPosition = new Vector2D(x + directions[directionIndex].x, y + directions[directionIndex].y);
            if (forwardPosition.x >= 0 && forwardPosition.x < mapWidth && forwardPosition.y >= 0 && forwardPosition.y < mapHeight && map[forwardPosition.y][forwardPosition.x] != obstacleColorIndex)
              graph.addDirectedEdge(node, nodes[forwardPosition.x][forwardPosition.y][directionIndex], 1);
          });
        }
      }));

      // Create end node edges
      let endNode = new Vector2D(end.x, end.y);
      graph.addNode(endNode);
      for (let i = 0; i < directions.length; i++)
        graph.addDirectedEdge(nodes[end.x][end.y][i], endNode, 0);

      // Find all shortest paths
      let bestPaths = graph.findAllShortestPaths(nodes[start.x][start.y][0], endNode).map(e => e.slice(0, -1));
      let bestPathScore = bestPaths[0].reduce((acc, node, i, path) => acc + (i == 0 ? 0 : graph.getEdgeWeight(path[i - 1], node)), 0);
      let maxNumberOfNodesInPath = bestPaths.reduce((acc, e) => Math.max(acc, e.length), 0);

      let bestPathPositions = new Set();
      for (let i = 0; i < maxNumberOfNodesInPath; i++) {
        if (this.isStopping)
          return;

        for (let path of bestPaths) {
          if (i < path.length) {
            let node = path[i];
            bestPathPositions.add(node.y * mapWidth + node.x);
            if (visualization) {
              if (!(node.x == start.x && node.y == start.y) && !(node.x == end.x && node.y == end.y))
                pixelMap.drawPixel(node.x, node.y, pathColorIndex);
            }
          }
        }

        if (visualization)
          await delay(1);
      }

      if (part == 1)
        return bestPathScore;
      else
        return bestPathPositions.size;
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