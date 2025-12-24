import { delay, Console, PixelMap, Vector2D, Graph } from "../../utility.mjs";

const emptyGridNodeColorIndex = 1;
const emptyGridNodeColor = "#000000";
const movableGridNodeColorIndex = 2;
const movableGridNodeColor = "#00aa00";
const unmovableGridNodeColorIndex = 3;
const unmovableGridNodeColor = "#999999";
const goalGridNodeColorIndex = 4;
const goalGridNodeColor = "#ffff00";

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
   * @returns {GridNode[]} Grid nodes.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let gridNodes = input.trim().split(/\r?\n/).slice(2).map((line, index) => {
      let match = line.match(/^\/dev\/grid\/node\-x(\d+)\-y(\d+)\s+(\d+)T\s+(\d+)T\s+(\d+)T\s+(\d+)\%$/);
      if (match == null || parseInt(match[5]) != parseInt(match[3]) - parseInt(match[4]) || parseInt(match[6]) != Math.floor(parseInt(match[4]) * 100 / parseInt(match[3])))
        throw new Error(`Invalid data in line ${index + 1}`);
      return new GridNode(new Vector2D(parseInt(match[1]), parseInt(match[2])), parseInt(match[3]), parseInt(match[4]));
    });

    consoleLine.innerHTML += " done.";
    return gridNodes;
  }

  /**
   * Finds the number of viable grid node pairs (part 1) or the fewest number of steps required to move goal data to grid node-x0-y0 (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of viable grid node pairs (part 1) or the fewest number of steps required to move goal data to grid node-x0-y0 (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let gridNodes = this.parse(input);

      let mapWidth = gridNodes.reduce((acc, e) => Math.max(acc, e.position.x), 0) +  1;
      let mapHeight = gridNodes.reduce((acc, e) => Math.max(acc, e.position.y), 0) + 1;

      let gridNodeMap = Array.from({length: mapHeight}, e => new Array(mapWidth).fill(null));
      gridNodes.forEach(gridNode => gridNodeMap[gridNode.position.y][gridNode.position.x] = gridNode);

      let pixelMap = new PixelMap(mapWidth, mapHeight);
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[emptyGridNodeColorIndex] = emptyGridNodeColor;
        pixelMap.palette[movableGridNodeColorIndex] = movableGridNodeColor;
        pixelMap.palette[unmovableGridNodeColorIndex] = unmovableGridNodeColor;
        pixelMap.palette[goalGridNodeColorIndex] = goalGridNodeColor;
      }

      // Find the empty grid node and make sure that there is only one.
      let emptyGridNodes = gridNodes.filter(e => e.used == 0);
      if (emptyGridNodes.length == 0)
        throw new Error("Empty grid node not found (solution is based on the assumption that there is only one empty grid node).");
      if (emptyGridNodes.length > 1)
        throw new Error("More than one empty grid node (solution is based on the assumption that there is only one empty grid node).");
      let emptyGridNode = emptyGridNodes[0];

      // Find movable and unmovable grid nodes
      for (let node of gridNodes) {
        if (node.used <= emptyGridNode.size && node.size >= emptyGridNode.size)
          node.isMovable = true;
        else if (node.used > emptyGridNode.size)
          node.isMovable = false;
        else
          throw new Error(`Node x${node.position.x}-y${node.position.y} can be moved but is not large enough to fit data from other movable nodes (solution is based on the assumption that there are no such nodes).`);
      }
      
      // Find top-left and top-right grid nodes
      let topLeftGridNode = gridNodeMap[0][0];
      let topRightGridNode = gridNodeMap[0][mapWidth - 1];
      if (topLeftGridNode == null)
        throw new Error("Top-left grid node not found.");
      if (topRightGridNode == null)
        throw new Error("Top-right grid node not found.");
      if (!topLeftGridNode.isMovable)
        throw new Error("Top-left grid node is not movable.");
      if (!topRightGridNode.isMovable)
        throw new Error("Top-right grid node is not movable.");

      if (visualization) {
        for (let x = 0; x < mapWidth; x++) {
          for (let y = 0; y < mapHeight; y++)
            pixelMap.drawPixel(x, y, unmovableGridNodeColorIndex);
        }
        for (let node of gridNodes) {
          if (node.isMovable)
            pixelMap.drawPixel(node.position.x, node.position.y, movableGridNodeColorIndex);
        }
        pixelMap.drawPixel(emptyGridNode.position.x, emptyGridNode.position.y, emptyGridNodeColorIndex);
        if (part == 2)
          pixelMap.drawPixel(topRightGridNode.position.x, topRightGridNode.position.y, goalGridNodeColorIndex);
      }

      // Find the viable grid node pairs
      let viableGridNodePairs = [];
      for (let i = 0; i < gridNodes.length; i++) {
        for (let j = i + 1; j < gridNodes.length; j++) {
          if (gridNodes[i].used != 0 && gridNodes[j].avail >= gridNodes[i].used)
            viableGridNodePairs.push([gridNodes[i], gridNodes[j]]);
          if (gridNodes[j].used != 0 && gridNodes[i].avail >= gridNodes[j].used)
            viableGridNodePairs.push([gridNodes[j], gridNodes[i]]);
        }
      }

      if (part == 1)
        return viableGridNodePairs.length;

      // Create graph
      let graph = new Graph();

      // Create graph nodes (possible pairs of empty and goal node positions)
      let graphNodes = Array.from({length: mapWidth}, (e, emptyX) => Array.from({length: mapHeight}, (e, emptyY) => {
        let emptyGridNode = gridNodeMap[emptyY][emptyX];
        if (emptyGridNode == null || !emptyGridNode.isMovable)
          return null;
        return Array.from({length: mapWidth}, (e, goalX) => Array.from({length: mapHeight}, (e, goalY) => {
          let goalGridNode = gridNodeMap[goalY][goalX];
          if (goalGridNode == null || !goalGridNode.isMovable || (emptyX == goalX && emptyY == goalY))
            return null;
          let node = new GraphNode(emptyGridNode.position, goalGridNode.position);
          graph.addNode(node);
          return node;
        }));
      }));

      // Create edges
      let directions = [new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(-1, 0), new Vector2D(0, -1)];
      graphNodes.forEach((e, emptyX) => e.forEach((e, emptyY) => {
        if (e != null) {
          e.forEach((e, goalX) => e.forEach((graphNode, goalY) => {
            if (graphNode != null) {
              directions.forEach(direction => {
                let neighborPosition = new Vector2D(emptyX + direction.x, emptyY + direction.y);
                if (neighborPosition.x >= 0 && neighborPosition.x < mapWidth && neighborPosition.y >= 0 && neighborPosition.y < mapHeight) {
                  if (neighborPosition.x == goalX && neighborPosition.y == goalY)
                    graph.addDirectedEdge(graphNode, graphNodes[goalX][goalY][emptyX][emptyY], 1);
                  else if (graphNodes[neighborPosition.x][neighborPosition.y] != null)
                    graph.addDirectedEdge(graphNode, graphNodes[neighborPosition.x][neighborPosition.y][goalX][goalY], 1);
                }
              });
            }
          }))
        }
      }));

      // Create end node edges
      let endNode = new GraphNode(null, new Vector2D(topLeftGridNode.position.x, topLeftGridNode.position.y));
      graph.addNode(endNode);
      for (let emptyX = 0; emptyX < mapWidth; emptyX++) {
        for (let emptyY = 0; emptyY < mapHeight; emptyY++) {
          let emptyGridNode = gridNodeMap[emptyY][emptyX];
          if (emptyGridNode != null && emptyGridNode.isMovable && (emptyX != topLeftGridNode.position.x || emptyY != topLeftGridNode.position.y))
            graph.addDirectedEdge(graphNodes[emptyX][emptyY][topLeftGridNode.position.x][topLeftGridNode.position.y], endNode, 1);
        }
      }

      // Find the shortest path
      let startNode = graphNodes[emptyGridNode.position.x][emptyGridNode.position.y][topRightGridNode.position.x][topRightGridNode.position.y];
      let shortestPath = graph.findShortestPath(startNode, endNode).slice(0, -1);

      if (visualization) {
        let solConsole = this.solConsole;
        solConsole.addLine(`Number of steps: ${shortestPath.length - 1}.`);
        let solConsoleLine = solConsole.addLine();

        for (let i = 0; i < shortestPath.length; i++) {
          if (this.isStopping)
            return;

          if (i > 0) {
            pixelMap.drawPixel(shortestPath[i - 1].emptyGridNodePosition.x, shortestPath[i - 1].emptyGridNodePosition.y, movableGridNodeColorIndex);
            pixelMap.drawPixel(shortestPath[i - 1].goalGridNodePosition.x, shortestPath[i - 1].goalGridNodePosition.y, movableGridNodeColorIndex);
          }

          pixelMap.drawPixel(shortestPath[i].emptyGridNodePosition.x, shortestPath[i].emptyGridNodePosition.y, emptyGridNodeColorIndex);
          pixelMap.drawPixel(shortestPath[i].goalGridNodePosition.x, shortestPath[i].goalGridNodePosition.y, goalGridNodeColorIndex);

          solConsoleLine.innerHTML = `Step: ${i}.`;
          await delay(50);
        }
      }

      return shortestPath.length - 1;
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
 * Puzzle grid node class.
 */
class GridNode {
  /**
   * @param {Vector2D} position Position.
   * @param {number} size Size.
   * @param {number} used Used space size.
   */
  constructor(position, size, used) {
    /**
     * Position.
     * @type {Vector2D}
     */
    this.position = position;
    /**
     * Size.
     * @type {number}
     */
    this.size = size;
    /**
     * Used space size.
     * @type {number}
     */
    this.used = used;
    /**
     * Available space size.
     * @type {number}
     */
    this.avail = size - used;
    /**
     * True if the node is movable.
     * @type {boolean}
     */
    this.isMovable;
  }
}

/**
 * Puzzle graph node class.
 */
class GraphNode {
  /**
   * @param {Vector2D} emptyGridNodePosition Empty grid node position.
   * @param {Vector2D} goalGridNodePosition Goal grid node position.
   */
  constructor(emptyGridNodePosition, goalGridNodePosition) {
    /**
     * Empty grid node position.
     * @type {Vector2D}
     */
    this.emptyGridNodePosition = emptyGridNodePosition;
    /**
     * Goal grid node position.
     * @type {Vector2D}
     */
    this.goalGridNodePosition = goalGridNodePosition;
  }
}