import { PriorityQueue } from "./priority-queue.mjs"

/**
 * Graph class.
 */
export class Graph {
  /**
   * Nodes.
   * @type {Map<object, GraphNode>}
   */
  #nodeMap;
  
  constructor() {
    this.#nodeMap = new Map();
  }

  /**
   * Adds a node to the graph. 
   * @param {object} object Node object.
   */
  addNode(object) {
    if (!this.#nodeMap.has(object))
      this.#nodeMap.set(object, new GraphNode(object));
  }

  /**
   * Adds a directed edge to the graph. 
   * @param {object} sourceObject Source node object.
   * @param {object} destinationObject Destination node object.
   * @param {number} weight Weight.
   */
  addDirectedEdge(sourceObject, destinationObject, weight) {
    let sourceNode = this.#nodeMap.get(sourceObject);
    let destinationNode = this.#nodeMap.get(destinationObject);
    if (sourceNode == undefined)
      throw new Error("Source node not found in the graph");
    if (destinationNode == undefined)
      throw new Error("Destination node not found in the graph");
    sourceNode.edges.push(new GraphEdge(sourceNode, destinationNode, weight)); 
  }

  /**
   * Adds an undirected edge to the graph. 
   * @param {object} node1Object Node 1 object.
   * @param {object} node2Object Node 2 object.
   * @param {number} weight Weight.
   */
  addUndirectedEdge(node1Object, node2Object, weight) {
    let node1 = this.#nodeMap.get(node1Object);
    let node2 = this.#nodeMap.get(node2Object);
    if (node1 == undefined)
      throw new Error("Node 1 not found in the graph");
    if (node2 == undefined)
      throw new Error("Node 2 not found in the graph");
    node1.edges.push(new GraphEdge(node1, node2, weight));
    node2.edges.push(new GraphEdge(node2, node1, weight));
  }

  /**
   * Gets the edge weight.
   * @param {object} sourceObject Source node object.
   * @param {object} destinationObject Destination node object.
   */
  getEdgeWeight(sourceObject, destinationObject) {
    let sourceNode = this.#nodeMap.get(sourceObject);
    let destinationNode = this.#nodeMap.get(destinationObject);
    if (sourceNode == undefined)
      throw new Error("Source node not found in the graph");
    if (destinationNode == undefined)
      throw new Error("Destination node not found in the graph");
    let edge = sourceNode.edges.find(e => e.destination.object == destinationObject);
    if (edge == undefined)
      throw new Error("Edge from source to destination not found in the graph");
    return edge.weight;
  }

  /**
   * Finds the shortest path between two nodes using Dijkstra's algorithm.
   * @param {object} startObject Start node object.
   * @param {object} endObject End node object.
   * @returns {object[]} Path.
   */
  findShortestPath(startObject, endObject) {
    return this.#findShortestPaths(startObject, endObject, false)[0];
  }

  /**
   * Finds all shortest paths between two nodes using Dijkstra's algorithm.
   * @param {object} startObject Start node object.
   * @param {object} endObject End node object.
   * @returns {object[][]} Paths.
   */
  findAllShortestPaths(startObject, endObject) {
    return this.#findShortestPaths(startObject, endObject, true);
  }

  /**
   * Finds the shortest paths between the nodes using Dijkstra's algorithm.
   * @param {object} startObject Start node object.
   * @param {object} endObject End node object.
   * @returns {object[][]} Paths.
   */
  #findShortestPaths(startObject, endObject, findAllPaths) {
    let startNode = this.#nodeMap.get(startObject);
    let endNode = this.#nodeMap.get(endObject);
    if (startNode == undefined)
      throw new Error("Path start node not found in the graph")
    if (endNode == undefined)
      throw new Error("Path end node not found in the graph")

    let queue = new PriorityQueue();

    for (let [nodeObject, node] of this.#nodeMap) {
      if (node == startNode) {
        node.distance = 0;
        queue.enqueue(startNode, 0);
      }
      else
        node.distance = Number.POSITIVE_INFINITY;
      node.isVisited = false;
    }

    let pathsToEndFound = false;
    while (queue.getSize() && !pathsToEndFound) {
      let node = queue.dequeue();
      if (!node.isVisited) {
        if (node == endNode)
          pathsToEndFound = true;
        for (let edge of node.edges) {
          let oldDistanceToNeighbor = edge.destination.distance;
          let newDistanceToNeighbor = node.distance + edge.weight;
          if (newDistanceToNeighbor < oldDistanceToNeighbor) {
            edge.destination.previousNodes = [node];
            edge.destination.distance = newDistanceToNeighbor;
            queue.enqueue(edge.destination, newDistanceToNeighbor);
          }
          if (findAllPaths && newDistanceToNeighbor == oldDistanceToNeighbor)
            edge.destination.previousNodes.push(node);
        }
        node.isVisited = true;
      }
    }

    if (endNode.distance == Number.POSITIVE_INFINITY)
      throw new Error("Path not found");

    let paths = [[endNode]];

    for (let newNodeAdded = true; newNodeAdded; ) {
      newNodeAdded = false;
      let numberOfPaths = paths.length;
      for (let i = 0; i < numberOfPaths; i++) {
        let path = paths[i];
        if (path[path.length - 1] != startNode) {
          let previousNodes = path[path.length - 1].previousNodes;
          for (let j = 1; j < previousNodes.length; j++) {
            paths.push(path.slice());
            paths[paths.length - 1].push(previousNodes[j]);
          }
          path.push(previousNodes[0]);
          newNodeAdded = true;
        }
      }
    }

    return paths.map(path => path.map(node => node.object).reverse());
  }
}

/**
 * Graph node class.
 */
class GraphNode {
  /**
   * @param {object} object Node object.
   */
  constructor(object) {
    /**
     * Node object.
     * @type {object}
     */
    this.object = object;
    /**
     * Edges.
     * @type {GraphEdge[]}
     */
    this.edges = [];
    /**
     * True if the node is visited (used in shortest path algorithm).
     * @type {boolean}
     */
    this.isVisited;
    /**
     * Distance to the node (used in shortest path algorithm).
     * @type {number}
     */
    this.distance;
    /**
     * Previous nodes (used in shortest path algorithm).
     * @type {GraphNode[]}
     */
    this.previousNodes;
  }
}

/**
 * Graph edge class.
 */
class GraphEdge {
  /**
   * @param {GraphNode} source Source node.
   * @param {GraphNode} destination Destination node.
   * @param {number} weight Weight.
   */
  constructor(source, destination, weight) {
    /**
     * Source node.
     * @type {GraphNode}
     */
    this.source = source;
    /**
     * Destination node.
     * @type {GraphNode}
     */
    this.destination = destination;
    /**
     * Weight.
     * @type {number}
     */
    this.weight = weight;
  }
}