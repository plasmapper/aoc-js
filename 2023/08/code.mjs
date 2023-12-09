import { delay, Console, leastCommonMultiple } from "../../utility.mjs";

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
   * @returns {NodesAndInstructions} Nodes and instructions.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let nodes = [];
    let instructions = [];

    input.trim().split(/\r?\n/).forEach((line, index) => {
      if (index == 0) {
        if (!/^[LR]+$/.test(line))
          throw new Error(`Invalid data in line ${index + 1}`);  
        instructions = line.split("");
      }
      if (index > 1) {
        let match = line.match(/^(.{3}) = \((.{3}), (.{3})\)$/);
        if (match == null)
          throw new Error(`Invalid data in line ${index + 1}`);
        nodes.push(new Node(nodes.length, match[1], match[2], match[3]));
      }
    });

    for (let node of nodes) {
      node.leftNode = nodes.find(destNode => destNode.name == node.leftNodeName);
      if (node.leftNode == undefined)
        throw new Error(`Invalid left node ${node.leftNodeName} for node ${node.name}`);
      node.rightNode = nodes.find(destNode => destNode.name == node.rightNodeName);
      if (node.rightNode == undefined)
        throw new Error(`Invalid right node ${node.rightNodeName} for node ${node.name}`);
    }

    consoleLine.innerHTML += " done.";
    return new NodesAndInstructions(nodes, instructions);
  }

  /**
   * Calculates the number of steps.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of steps.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {nodes, instructions} = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Find the number of steps from AAA to ZZZ
      if (part == 1) {
        let startNode = nodes.find(node => node.name == "AAA");
        if (startNode == undefined)
          throw new Error(`Start node AAA not found`);
        let endNode = nodes.find(node => node.name == "ZZZ");
        if (endNode == undefined)
          throw new Error(`End node ZZZ not found`);

        for (let step = 1, node = startNode; node != endNode; step++) {
          let instruction = instructions[(step - 1) % instructions.length];
          let newNode = instruction == "L" ? node.leftNode : node.rightNode;
  
          if (visualization)
            visConsole.addLine(`Step ${step}: From ${node.name} ${instruction == "L" ? "left" : "right"} to ${newNode.name}.`);
          node = newNode;
  
          if (node == endNode)
            return step;
        }
      }
      // Find the number of steps from all xxA to simultaneously be at any xxZ
      else {
        let startNodes = nodes.filter(node => node.name.substring(2) == "A");
        let endNodes = new Set(nodes.filter(node => node.name.substring(2) == "Z"));
        //if (startNodes.length == 0 || startNodes.length != endNodes.size)
          //throw new Error("Number of start and/or end nodes in invalid");

        // Find possible routes from all end nodes to all other nodes
        for (let startNode of startNodes) {
          // Situations that already occured (node index + instruction index * number of nodes)
          let situations = new Map();
          let stop = false;
          for (let step = 0, node = startNode; !stop; step++) {
            let instructionIndex = step % instructions.length;
            let situation = node.index + instructionIndex * nodes.length;
            if (situations.has(situation)) {
              stop = true;
              if (startNode.numberOfStepsToEndNode == 0)
                throw new Error(`Start node ${startNode.name} does not lead to any end node`);
              let cycleStartStep = situations.get(situation);
              if (cycleStartStep <= startNode.numberOfStepsToEndNode)
                startNode.numberOfCycleSteps = step - cycleStartStep;
            }
            else {
              situations.set(situation, step);
              node = instructions[instructionIndex] == "L" ? node.leftNode : node.rightNode;
              // In puzzle input there is only one end node for each start node
              if (endNodes.has(node)) {
                startNode.numberOfStepsToEndNode = step + 1;
                startNode.endNode = node;
              }
            }
          }
        }

        if (visualization) {
          for (let startNode of startNodes) {
            visConsole.addLine(`Starting from ${startNode.name} the end node ${startNode.endNode.name} is reached after ${startNode.numberOfStepsToEndNode} steps and each ${startNode.numberOfCycleSteps} steps after that.`);
            visConsole.addLine();
          }
        }

        // In the puzzle input numberOfStepsToEndNode is equal to numberOfCycleSteps for all start nodes
        let totalNumberOfSteps = startNodes[0].numberOfStepsToEndNode;
        for (let i = 1; i < startNodes.length; totalNumberOfSteps = leastCommonMultiple(totalNumberOfSteps, startNodes[i++].numberOfStepsToEndNode));

        return totalNumberOfSteps;
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
 * Puzzle node class.
 */
class Node {
  /**
   * @param {number} index Node index.
   * @param {string} name Node name.
   * @param {string} name Left node name.
   * @param {string} name Right node name.
   */
  constructor(index, name, leftNodeName, rightNodeName) {
    /**
     * Node index.
     * @type {number}
     */
    this.index = index;
    /**
     * Node name.
     * @type {string}
     */
    this.name = name;
    /**
     * Left node name.
     * @type {string}
     */
    this.leftNodeName = leftNodeName;
    /**
     * Right node name.
     * @type {string}
     */
    this.rightNodeName = rightNodeName;
    /**
     * Left node.
     * @type {Node}
     */
    this.leftNode = null;
    /**
     * Right node.
     * @type {Node}
     */
    this.rightNode = null;
    /**
     * End node for this node being a start node.
     * @type {Node}
     */
    this.endNode = null;
    /**
     * Number of steps to the end node.
     * @type {number}
     */
    this.numberOfStepsToEndNode = 0;
    /**
     * Number of steps to reach the end node again after reaching it.
     * @type {number}
     */
    this.numberOfCycleSteps = 0;
  }
}

class NodesAndInstructions {
  /**
   * @param {Node[]} nodes Nodes.
   * @param {string[]} instructions Instructions.
   */
  constructor(nodes, instructions) {
    /**
     * Nodes.
     * @type {Node[]}
     */
    this.nodes = nodes;
    /**
     * Instructions.
     * @type {string[]}
     */
    this.instructions = instructions;
  }
}