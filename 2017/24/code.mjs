import { delay, Console } from "../../utility.mjs";

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
   * @returns {number[][]} Components.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let components = input.trim().split(/\r?\n/).map((line, index) => {
      let match = line.match(/^(\d+)\/(\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return [parseInt(match[1]), parseInt(match[2])];
    });

    consoleLine.innerHTML += " done.";
    return components;
  }

  /**
   * Finds the strength of the strongest bridge (part 1) or the strength of the longest and (if several bridges have the same length) strongest bridge (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Strength of the strongest bridge (part 1) or the strength of the longest and (if several bridges have the same length) strongest bridge (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let components = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let bridges = [new Bridge([[0, 0]], components)];
      let resultBridges = [];
      while (bridges.length > 0) {
        let newBridges = []
        for (let bridge of bridges) {
          let pins = bridge.bridgeComponents[bridge.bridgeComponents.length - 1][1];
          for (let i = 0; i < bridge.componentsLeft.length; i++) {
            let component = bridge.componentsLeft[i];
            if (component[0] == pins || component[1] == pins) {
              let newComponentsLeft = bridge.componentsLeft.slice();
              newComponentsLeft.splice(i, 1);
              let newBridge = new Bridge([...bridge.bridgeComponents.slice(), component[0] == pins ? [component[0], component[1]] : [component[1], component[0]]], newComponentsLeft);
              newBridges.push(newBridge);

              if (resultBridges.length == 0)
                resultBridges.push(newBridge);
              else {
                if (part == 1) {
                  if (newBridge.strength > resultBridges[0].strength)
                    resultBridges[0] = newBridge;
                }
                else {
                  if (newBridge.length > resultBridges[0].length)
                    resultBridges = [newBridge];
                  else if (newBridge.length == resultBridges[0].length)
                    resultBridges.push(newBridge);
                }
              }
            }
          }
        }
        bridges = newBridges;
      }

      if (resultBridges.length == 0)
        throw new Error("Solution not found");

      if (part == 2)
        resultBridges.sort((a, b) => b.strength - a.strength);

      if (visualization) {
        visConsole.addLine(`${part == 1 ? "Strongest" : "Longest and strongest"} bridge: ` +
          `${resultBridges[0].bridgeComponents.slice(1).map(e => `${e[0]}/${e[1]}`).join("--")} (strength: <span class="highlighted">${resultBridges[0].strength}</span>).`);
      }

      return resultBridges[0].strength;
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
 * Puzzle bridge class.
 */
class Bridge {
  /**
   * @param {number[][]} bridgeComponents Bridge components.
   * @param {number[][]} componentsLeft Components left.
   */
  constructor(bridgeComponents, componentsLeft) {
    /**
     * Bridge components.
     * @type {number[][]}
     */
    this.bridgeComponents = bridgeComponents;
    /**
     * Components left.
     * @type {number[][]}
     */
    this.componentsLeft = componentsLeft;
    /**
     * Length.
     * @type {number}
     */
    this.length = bridgeComponents.length;
    /**
     * Strength.
     * @type {number}
     */
    this.strength = bridgeComponents.reduce((acc, e) => acc + e[0] + e[1], 0);
  }
}