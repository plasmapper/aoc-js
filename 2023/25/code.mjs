import { delay, Console } from "../../utility.mjs";

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
    this.noPart2 = true;
  }

  /**
   * Parses the puzzle input.
   * @param {string} input Puzzle input.
   * @returns {Set<Component>} Components.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let components = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match = line.match(/^(.+): (.+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);

      let c1 = components.find(e => e.name == match[1]);
      if (c1 == undefined)
        components.push(c1 = new Component(match[1]));

      for (let c2Name of match[2].split(" ")) {
        let c2 = components.find(e => e.name == c2Name);
        if (c2 == undefined)
          components.push(c2 = new Component(c2Name));
        c1.connections.add(c2);
        c2.connections.add(c1);
      }
    });

    consoleLine.innerHTML += " done.";
    
    return new Set(components);
  }

  /**
   * Finds three connections that should be disconnected to divide the components into two groups.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Multiplied numbers of components in two groups.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let components = this.parse(input);

      let centerNodes = [];
      let disconnectedWires = [];

      // Find the most frequent components in shortest routes and remove them
      for (let i = 0; i < 3; i++) {
        this.findComponentFrequency(components);
        let nodes = Array.from(components).sort((c1, c2) => c2.frequency - c1.frequency);
        if (i < 2) {
          centerNodes.push(nodes[0]);
          for (let conn of nodes[0].connections)
            conn.connections.delete(nodes[0]);
          components.delete(nodes[0]);
        }
        else {
          nodes[0].connections.delete(nodes[1]);
          nodes[1].connections.delete(nodes[0]);
          disconnectedWires.push([nodes[0], nodes[1]]);
        }        
      }

      // Add found components one by one and find most frequent links which are between the two most frequent components
      for (let centerNode of centerNodes) {
        components.add(centerNode)
        for (let conn of centerNode.connections)
          conn.connections.add(centerNode);

        this.findComponentFrequency(components);
        let nodes = Array.from(components).sort((c1, c2) => c2.frequency - c1.frequency);
        nodes[0].connections.delete(nodes[1]);
        nodes[1].connections.delete(nodes[0]);
        disconnectedWires.push([nodes[0], nodes[1]]);
      }

      let onePartComponents = new Set();
      onePartComponents.add(centerNodes[0]);

      let newComponentFound = true;
      while (newComponentFound) {
        newComponentFound = false;
        for (let c1 of onePartComponents) {
          for (let c2 of c1.connections)   {
            if (!onePartComponents.has(c2)) {
              newComponentFound = true;
              onePartComponents.add(c2);
            }
          }
        }
      }

      if (visualization) {
        let visConsole = new Console();
        this.visContainer.append(visConsole.container);
        visConsole.addLine(`Wires that should be disconnected:`);
        visConsole.addLine(`  ${disconnectedWires[0][0].name}-${disconnectedWires[0][1].name}`);
        visConsole.addLine(`  ${disconnectedWires[1][0].name}-${disconnectedWires[1][1].name}`);
        visConsole.addLine(`  ${disconnectedWires[2][0].name}-${disconnectedWires[2][1].name}`);
      }

      return onePartComponents.size * (components.size - onePartComponents.size);
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

  /**
   * Calculates the frequency of component occurrence in shortest routes.
   * @param {Component[]} components Components.
   */
  findComponentFrequency(components) {
    for (let component of components)
      component.frequency = 0;

    for (let start of components) {
      for (let component of components)
        component.isVisited = false;
      
      let routes = new Set();
      routes.add([start]);
      start.isVisited = true;

      while (routes.size) {
        let newRoutes = new Set();

        for (let route of routes) {
          for (let component of route)
            component.frequency++;
          for (let nextComponent of route[route.length - 1].connections) {
            if (!nextComponent.isVisited) {
              nextComponent.isVisited = true;
              let newRoute = route.slice();
              newRoute.push(nextComponent);
              newRoutes.add(newRoute);
            }
          }
        }
        routes = newRoutes;
      }
    }
  }
}

/**
 * Puzzle component class
 */
class Component {
  /**
   * @param {string} name Component name.
   */
  constructor(name) {
    /**
     * Component name.
     * @type {string}
     */
    this.name = name;
    /**
     * Connections to other components.
     * @type {Set<Component>}
     */
    this.connections = new Set();
    /**
     * Component frequency in routes.
     * @type {number}
     */
    this.frequency = 0;
    /**
     * Component has been visited while finding routes.
     * @type {boolean}
     */
    this.isVisited = false;
  }
}