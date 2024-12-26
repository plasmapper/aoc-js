import { delay, Console, PixelMap, Vector2D, PriorityQueue } from "../../utility.mjs";

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

      // Node array [x][y][xDirection][yDirection][numberOfSameDirectionSteps]
      let nodes = [];
      for (let x = 0; x < mapWidth; x++) {
        let yArray = [];
        nodes.push(yArray);
        for (let y = 0; y < mapHeight; y++) {
          let xDirectionArray = [];
          yArray.push(xDirectionArray);
          for (let xDirection of [-1, 0, 1]) {
            let yDirectionArray = [];
            xDirectionArray[xDirection] = yDirectionArray;
            for (let yDirection of [-1, 0, 1]) {
              let numberOfSameDirectionStepsArray = [];
              yDirectionArray[yDirection] = numberOfSameDirectionStepsArray;
              for (let numberOfSameDirectionSteps = 0; numberOfSameDirectionSteps <= maxNumberOfSameDirectionSteps; numberOfSameDirectionSteps++)
                numberOfSameDirectionStepsArray.push(new Node(new Vector2D(x, y), new Vector2D(xDirection, yDirection), numberOfSameDirectionSteps));
            }
          }
        }
      }

      // Start and end nodes
      let startNodes = new Set();
      startNodes.add(nodes[0][0][1][0][0]);
      startNodes.add(nodes[0][0][0][1][0]);
      let endNodes = new Set();
      for (let i = minNumberOfSameDirectionSteps; i <= maxNumberOfSameDirectionSteps; i++) {
        endNodes.add(nodes[mapWidth - 1][mapHeight - 1][1][0][i]);
        endNodes.add(nodes[mapWidth - 1][mapHeight - 1][0][1][i]);
      }

      // Dijkstra's algorithm
      let queue = new PriorityQueue();
      for (let startNode of startNodes) {
        startNode.heatLoss = 0;
        queue.enqueue(startNode, 0);
        startNode.isInQueue = true;
      }

      while (queue.getSize()) {
        let node = queue.dequeue();

        if (endNodes.has(node)) {
          if (visualization) {
            let nodes = [node];
            for (let previousNode = node.previousNode; previousNode != undefined; previousNode = previousNode.previousNode)
              nodes.push(previousNode);
            nodes.reverse();
            for (let n of nodes) {
              if (this.isStopping)
                return 0;
              pixelMap.drawPixel(n.position.x, n.position.y, highlightColorIndex);
              await delay(1);
            }
          }
          return node.heatLoss;
        }

        let neighbors = [];
        if (node.numberOfSameDirectionSteps < maxNumberOfSameDirectionSteps) {
          let point = node.position.clone().add(node.direction);
          if (nodes[point.x] != undefined && nodes[point.x][point.y] != undefined)
            neighbors.push(nodes[point.x][point.y][node.direction.x][node.direction.y][node.numberOfSameDirectionSteps + 1]);
        }
        if (node.numberOfSameDirectionSteps >= minNumberOfSameDirectionSteps) {
          let point = new Vector2D(node.position.x + node.direction.y, node.position.y + node.direction.x);
          if (nodes[point.x] != undefined && nodes[point.x][point.y] != undefined)
            neighbors.push(nodes[point.x][point.y][node.direction.y][node.direction.x][1]);
          point = new Vector2D(node.position.x - node.direction.y, node.position.y - node.direction.x);
          if (nodes[point.x] != undefined && nodes[point.x][point.y] != undefined)
            neighbors.push(nodes[point.x][point.y][-node.direction.y][-node.direction.x][1]);
        }

        for (let neighbor of neighbors) {
          let heatLoss = node.heatLoss + map[neighbor.position.y][neighbor.position.x];
          if (heatLoss < neighbor.heatLoss) {
            neighbor.heatLoss = heatLoss;
            neighbor.previousNode = node;
            if (!neighbor.isInQueue) {
              queue.enqueue(neighbor, heatLoss);
              neighbor.isInQueue = true;
            }
          }
        }
      }
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
 * Puzzle route node class.
 */
class Node {
  /**
   * @param {Vector2D} position Position.
   * @param {Vector2D} direction Direction.
   * @param {number} numberOfSameDirectionSteps Number of steps already made in the same direction.
   */
  constructor(position, direction, numberOfSameDirectionSteps) {
    /**
     * Position.
     * @type {Vector2D}
     */
    this.position = position;
    /**
     * Direction.
     * @type {Vector2D}
     */
    this.direction = direction;
    /**
     * Number of steps already made in the same direction.
     * @type {number}
     */
    this.numberOfSameDirectionSteps = numberOfSameDirectionSteps;
    /**
     * Heat loss.
     * @type {number}
     */
    this.heatLoss = Number.MAX_VALUE;
    /**
     * Previous node.
     * @type {Node}
     */
    this.previousNode = undefined;
    /**
     * Node is in queue.
     * @type {boolean}
     */
    this.isInQueue = false;
  }
}