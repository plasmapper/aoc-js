import { delay, Console, PixelMap, Vector2D, PriorityQueue } from "../../utility.mjs";

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

    let map = input.trim().split(/\r?\n/).map((line, lineIndex, lines) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${lineIndex + 1}`);
      if (((lineIndex == 0 || lineIndex == lines.length - 1) && !/^#+$/.test(line)) || !/^#[#\.SE]+#$/.test(line))
        throw new Error(`Invalid data in line ${lineIndex + 1}`);
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

      // Create nodes
      let nodeMap = new Map();
      let directions = [new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(-1, 0), new Vector2D(0, -1)];
      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          if (map[y][x] != obstacleColorIndex)
            nodeMap.set(y * mapWidth + x, directions.map(direction => new Node(new Vector2D(x, y), direction)));
        }
      }

      // Create edges
      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          if (map[y][x] != obstacleColorIndex) {
            for (let i = 0; i < directions.length; i++) {
              let node = nodeMap.get(y * mapWidth + x)[i];
              // Add right turn
              node.edges.push(new Edge(nodeMap.get(y * mapWidth + x)[(i + 1) % directions.length], 1000));
              // Add left turn
              node.edges.push(new Edge(nodeMap.get(y * mapWidth + x)[(i - 1 + directions.length) % directions.length], 1000));
              // Add forward move
              let forwardNodes = nodeMap.get((node.position.y + node.direction.y) * mapWidth + node.position.x + node.direction.x);
              if (forwardNodes != undefined)
                node.edges.push(new Edge(forwardNodes[i], 1));
            }
          }
        }
      }

      let bestPathScore = -1;
      let bestPaths = [];

      // Dijkstra's algorithm for all shortest paths
      let queue = new PriorityQueue();
      let startNode = nodeMap.get(start.y * mapWidth + start.x)[0];
      startNode.distance = 0;
      queue.enqueue(startNode, 0);
      startNode.isInQueue = true;

      while (queue.getSize()) {
        let node = queue.dequeue();

        if (node.position.x == end.x && node.position.y == end.y) {
          if (bestPathScore < 0)
            bestPathScore = node.distance;

          if (node.distance == bestPathScore) {
            let previousNodes = new Set();
            previousNodes.add(node);
            for (let i = 0; previousNodes.size > 0; i++) {
              if (bestPaths[i] == undefined)
                bestPaths.push(new Set());

              let newPreviousNodes = new Set();
              for (let previousNode of previousNodes) {
                bestPaths[i].add(previousNode);
                [...previousNode.previousNodes].forEach(e => newPreviousNodes.add(e));
              }
              previousNodes = newPreviousNodes;
            }
          }
        }

        for (let edge of node.edges) {
          let distance = node.distance + edge.distance;
          if (distance <= edge.node.distance) {
            if (distance < edge.node.distance) {
              edge.node.distance = distance;
              edge.node.previousNodes = new Set();
            }
            edge.node.previousNodes.add(node);
            
            if (!edge.node.isInQueue) {
              queue.enqueue(edge.node, distance);
              edge.node.isInQueue = true;
            }
          }
        }
      }

      if (bestPathScore < 0)
        throw new Error("End can not be reached")

      let bestPathPositions = new Set();
      bestPaths.reverse();
      for (let nodes of bestPaths) {
        if (this.isStopping)
          return;

        for (let node of nodes) {
          bestPathPositions.add(node.position.y * mapWidth + node.position.x);
          if (visualization) {
            if (!(node.position.x == start.x && node.position.y == start.y) && !(node.position.x == end.x && node.position.y == end.y)) {
              pixelMap.drawPixel(node.position.x, node.position.y, pathColorIndex);
              await delay(1);
            }
          }
        }
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

/**
 * Puzzle node class.
 */
class Node {
  /**
   * @param {Vector2D} position Position.
   * @param {Vector2D} direction Direction.
   */
  constructor(position, direction) {
    /**
     * Position
     * @type {Vector2D}
     */
    this.position = position;
    /**
     * Direction.
     * @type {Vector2D}
     */
    this.direction = direction;
    /**
     * Edges.
     * @type {Edge[]}
     */
    this.edges = [];
    /**
     * Distance.
     * @type {number}
     */
    this.distance = Number.MAX_VALUE;
    /**
     * Previous node.
     * @type {Node}
     */
    this.previousNodes = new Set();
    /**
     * Node is in queue.
     * @type {boolean}
     */
    this.isInQueue = false;
  }
}

/**
 * Puzzle edge class.
 */
class Edge {
  /**
   * @param {Node} destination Node.
   * @param {number} distance Distance.
   */
  constructor(node, distance) {
    /**
     * Node
     * @type {Node}
     */
    this.node = node;
    /**
     * Distance.
     * @type {number}
     */
    this.distance = distance;
  }
}