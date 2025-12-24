import { delay, Console, PixelMap, Vector2D, Graph } from "../../utility.mjs";

const obstacleColorIndex = 1;
const obstacleColor = "#999999";
const pathColorIndex = 2;
const pathColor = "#ffffff";
const destinationColorIndex = 3;
const destinationColor = "#ffff00";

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
   * destinations: Vector2D[],
   * }} Map and destinations.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let destinations = new Array(10).fill(null);
    let map = input.trim().split(/\r?\n/).map((line, index, lines) => {
      if (line.length != lines[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);
      if (((index == 0 || index == lines.length - 1) && !/^#+$/.test(line)) || !/^#[#\.\d]+#$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      for (let x = 0; x < line.length; x++) {
        if (/\d/.test(line[x])) {
          let destinationIndex = parseInt(line[x]);
          if (destinations[destinationIndex] != null)
            throw new Error(`Point of interest ${destinationIndex} defined more than once`);
          destinations[destinationIndex] = new Vector2D(x, index);
        }
      }
      return line.split("").map(e => e == "#" ? obstacleColorIndex : (e == "." ? 0 : destinationColorIndex));
    });

    if (destinations[0] == null)
      throw new Error("Start position not found");

    destinations = destinations.filter(e => e != null);

    consoleLine.innerHTML += " done.";
    return { map, destinations };
  }

  /**
   * Calculates the fewest number of steps required to visit every non-0 number marked on the map at least once (part 1) or the fewest number of steps required to start at 0, visit every non-0 number marked on the map at least once, and then return to 0 (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Fewest number of steps required to visit every non-0 number marked on the map at least once (part 1) or the fewest number of steps required to start at 0, visit every non-0 number marked on the map at least once, and then return to 0 (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let { map, destinations } = this.parse(input);

      if (destinations.length < 2)
        throw new Error("Too few points of interest");

      let mapWidth = map[0].length;
      let mapHeight = map.length;

      let pixelMap = new PixelMap(mapWidth, mapHeight);
 
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[obstacleColorIndex] = obstacleColor;
        pixelMap.palette[pathColorIndex] = pathColor;
        pixelMap.palette[destinationColorIndex] = destinationColor;
  
        pixelMap.draw(map);
      }
      
      // Create graph
      let graph = new Graph();

      // Create nodes
      let directions = [new Vector2D(1, 0), new Vector2D(0, 1), new Vector2D(-1, 0), new Vector2D(0, -1)];
      let nodes = Array.from({length: mapWidth}, (e, x) => Array.from({length: mapHeight}, (e, y) => {
        if (map[y][x] == obstacleColorIndex)
          return null;
        let node = new Vector2D(x, y);
        graph.addNode(node);
        return node;
      }));

      // Create edges
      nodes.forEach((e, x) => e.forEach((node, y) => {
        if (map[y][x] != obstacleColorIndex) {
          directions.forEach(direction => {
            let neighborPosition = new Vector2D(x + direction.x, y + direction.y);
            if (map[neighborPosition.y][neighborPosition.x] != obstacleColorIndex)
              graph.addDirectedEdge(node, nodes[neighborPosition.x][neighborPosition.y], 1);
          });
        }
      }));

      // Find shortest paths between all destination pairs
      let destinationPairRoutes = [];
      for (let i = 0; i < destinations.length; i++) {
        destinationPairRoutes.push([]);
        for (let j = 0; j < destinations.length; j++) {
          if (j < i)
            destinationPairRoutes[i].push(destinationPairRoutes[j][i].slice().reverse());
          else if (i == j)
            destinationPairRoutes[i].push(null);
          else
            destinationPairRoutes[i].push(graph.findShortestPath(nodes[destinations[i].x][destinations[i].y], nodes[destinations[j].x][destinations[j].y]));
        }
      }

      // Find all destination index permutations
      let findPermutations = array => array.reduce((acc, e, i) => {
        let arrayWithoutElement = array.slice();
        arrayWithoutElement.splice(i, 1);
        if (arrayWithoutElement.length == 1)
          return [...acc, [e, arrayWithoutElement[0]]];
        return [...acc, ...findPermutations(arrayWithoutElement).map(permutation => [e, ...permutation])];
      }, []);
      let destinationIndexPermutations = findPermutations(new Array(destinations.length - 1).fill(null).map((e, i) => i + 1)).map(e => part == 1 ? [0, ...e] : [0, ...e, 0]);

      // Find the destination permutation that leads to the shortest path
      let minTotalPathLength = Number.MAX_SAFE_INTEGER;
      let minTotalPathDestinationIndexPermutation = null;
      for (let destinationIndexPermutation of destinationIndexPermutations) {
        let totalPathLength = 0;
        for (let i = 1; i < destinationIndexPermutation.length; i++)
          totalPathLength += destinationPairRoutes[destinationIndexPermutation[i - 1]][destinationIndexPermutation[i]].length - 1;
        if (totalPathLength < minTotalPathLength) {
           minTotalPathLength = totalPathLength;
           minTotalPathDestinationIndexPermutation = destinationIndexPermutation;
        }
      }

      if (visualization) {
        let solConsole = this.solConsole;
        solConsole.addLine(`Number of steps: ${minTotalPathLength}.`);
        let solConsoleLine = solConsole.addLine();
        let step = 1;

        for (let i = 1; i < minTotalPathDestinationIndexPermutation.length; i++) {
          let startDestinationIndex = minTotalPathDestinationIndexPermutation[i - 1];
          let endDestinationIndex = minTotalPathDestinationIndexPermutation[i];

          let path = destinationPairRoutes[startDestinationIndex][endDestinationIndex];
          for (let j = 1; j < path.length; j++) {
            if (this.isStopping)
              return;
            
            pixelMap.drawPixel(path[j].x, path[j].y, pathColorIndex);
            destinations.forEach(e => pixelMap.drawPixel(e.x, e.y, destinationColorIndex));
                
            solConsoleLine.innerHTML = `Step: ${step++}.`;
            await delay(10);
          }

          if (i < minTotalPathDestinationIndexPermutation.length - 1)
          for (let j = 1; j < path.length; j++)
            pixelMap.drawPixel(path[j].x, path[j].y, 0);
        }
      }

      return minTotalPathLength;

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