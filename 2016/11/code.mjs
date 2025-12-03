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
  }

  /**
   * Parses the puzzle input.
   * @param {string} input Puzzle input.
   * @returns {{
   * elements: string[],
   * startState: State
   * }} Bots and outputs.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let lines = input.trim().split(/\r?\n/).map(e => e.replaceAll(",", "").replaceAll(" and a ", " a "));
    
    if (lines.length != 4)
      throw new Error("Incorrect number of lines");

    let elements = [];
    let startState = new State(1);

    let floorNames = ["first", "second", "third", "fourth"];
    for (let floorIndex = 0; floorIndex < floorNames.length; floorIndex++) {
      let lineMatch;
      if ((lineMatch = lines[floorIndex].match(new RegExp(`^The ${floorNames[floorIndex]} floor contains(( a (([a-z]+ generator)|([a-z]+\-compatible microchip)))+| nothing relevant).$`))) == null)
        throw new Error(`Invalid data in line ${floorIndex + 1}`);

      if (lineMatch[1] != " nothing relevant") {
        for (let object of lineMatch[1].substring(3).split(" a ")) {
          let objectMatch = object.match(/^([a-z]+)(( generator)|(-compatible microchip))$/);
          let elementIndex = elements.indexOf(objectMatch[1]);
          if (elementIndex < 0) {
            elements.push(objectMatch[1]);
            startState.objectFloorPairs.push(new FloorPair(null, null));
            elementIndex = elements.length - 1;
          }
          if (objectMatch[2] == " generator")
            startState.objectFloorPairs[elementIndex].generator = floorIndex + 1;
          if (objectMatch[2] == "-compatible microchip")
            startState.objectFloorPairs[elementIndex].microchip = floorIndex + 1;
        }
      }
    }

    for (let i = 0; i < elements.length; i++) {
      if (startState.objectFloorPairs[i].generator == null)
        throw new Error(`${elements[i]} generator not found`)
      if (startState.objectFloorPairs[i].microchip == null)
        throw new Error(`${elements[i]}-compatible microchip not found`)
    }

    consoleLine.innerHTML += " done.";
    return {elements, startState};
  }

  /**
   * Finds minimum number of steps required to bring all of the objects to the fourth floor.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Minimum number of steps required to bring all of the objects to the fourth floor.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {elements, startState} = this.parse(input);

      if (part == 2) {
        elements.push("elerium");
        startState.objectFloorPairs.push(new FloorPair(1, 1));
        if (startState.objectFloorPairs.length > 3) {
          elements.push("dilithium");
          startState.objectFloorPairs.push(new FloorPair(1, 1));
        }
      }

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let maxFloor = 4;

      // All possible single and pair combinations of objects
      // Object in combinations is represented by an array [type (0 - generator / 1 - microship), element index]
      let allPossibleObjectCombinations = [];
      for (let i = 0; i < elements.length * 2; i++) {
        allPossibleObjectCombinations.push([[Math.floor(i / elements.length), i % elements.length]]);
        for (let j = i + 1; j < elements.length * 2; j++)
          allPossibleObjectCombinations.push([[Math.floor(i / elements.length), i % elements.length], [Math.floor(j / elements.length), j % elements.length]]);
      }

      let stateHistorySet = new Set();
      stateHistorySet.add(startState.hash());
      let finalState = null;

      for (let stateQueue = [startState]; stateQueue.length > 0 && finalState == null; ) {
        let newStateQueue = [];
        for (let state of stateQueue) {
          let startFloor = state.elevatorFloor;
          for (let endFloor of [startFloor - 1, startFloor + 1].filter(e => e >= 1 && e <= maxFloor)) {
            for (let objectCombination of allPossibleObjectCombinations) {
              // Move every possible single and pair combinations of objects from start floor to end floor
              if (objectCombination.every(e => (e[0] == 0 ? state.objectFloorPairs[e[1]].generator : state.objectFloorPairs[e[1]].microchip) == startFloor)) {
                let newState = state.clone();
                newState.elevatorFloor = endFloor;
                objectCombination.forEach(e => {
                  if (e[0] == 0)
                    newState.objectFloorPairs[e[1]].generator = endFloor;
                  else
                    newState.objectFloorPairs[e[1]].microchip = endFloor;
                });
                newStateQueue.push(newState);
              }
            }
          }
        }

        stateQueue = newStateQueue.filter(state => {
          let stateHash = state.hash();
          // Exclude states that have already been found (states that are permutations of generator/microchip pairs have the same hash)
          if (!stateHistorySet.has(stateHash)) {
            stateHistorySet.add(stateHash);
            // Exclude states that are not possible (microchip without a corresponding generator near another generator)
            if (state.isPossible()) {
              if (state.objectFloorPairs.every(e => e.generator == maxFloor && e.microchip == maxFloor))
                finalState = state;
              return true;
            }
          }
          return false;
        });
      }

      if (finalState == null)
        throw new Error("Solution not found");

      if (visualization) {
        let states = finalState.previousStates.slice();
        states.push(finalState);

        let solConsole = this.solConsole;
        solConsole.addLine(`Number of steps: ${states.length - 1}.`);
        let solConsoleLine = solConsole.addLine();

        visConsole.container.style.width = `${elements.length * 4.5 + 4}em`;
        visConsole.container.style.height = `${maxFloor * 1.25}em`;

        for (let floor = 1; floor <= maxFloor; floor++)
          visConsole.addLine();

        elements = elements.map(e => e[0].toUpperCase() + e[1].toLowerCase());

        for (let step = 0; step < states.length; step++) {
          if (this.isStopping)
            return;

          for (let floor = 1; floor <= maxFloor; floor++) {
            let visConsoleString = `F${floor} ${states[step].elevatorFloor == floor ? " E " : " . "} `;
            visConsoleString += states[step].objectFloorPairs.map((e, i) => (e.generator == floor ? `G${elements[i]}` : " . ") + " " + (e.microchip == floor ? `M${elements[i]}` : " . ")).join(" ");
            visConsole.lines[maxFloor - floor].innerHTML = visConsoleString;
          }

          solConsoleLine.innerHTML = `Step: ${step}.`;

          await delay(250);          
        }
      }

      return finalState.previousStates.length;
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
 * Puzzle state class.
 * @param {number} generator Generator floor.
 * @param {number} microchip Microchip floor.
 */
class FloorPair {
  constructor(generator, microchip) {
    /**
     * Generator floor.
     * @type {number}
     */
    this.generator = generator;
    /**
     * Microchip floor.
     * @type {number}
     */
    this.microchip = microchip;
  }
}

/**
 * Puzzle state class.
 */
class State {
  /**
   * @param {number} elevatorFloor Elevator floor.
   * @param {FloorPair[]} objectFloorPairs Object floor pairs.
   * @param {State[]} previousStates Previous states.
   */
  constructor(elevatorFloor, objectFloorPairs = [], previousStates = []) {
    /**
     * Elevator floor.
     * @type {number}
     */
    this.elevatorFloor = elevatorFloor;
    /**
     * Object floor pairs.
     * @type {FloorPair[]}
     */
    this.objectFloorPairs = objectFloorPairs;
    /**
     * Previous states.
     * @type {State[]}
     */
    this.previousStates = previousStates;
  }

  /**
   * Clones the state.
   * @returns {State} Copy of the state with this state added as previous state.
   */
  clone() {
    let newState = new State(this.elevatorFloor, this.objectFloorPairs.map(e => new FloorPair(e.generator, e.microchip)), this.previousStates.slice());
    newState.previousStates.push(this);
    return newState;
  }

  /**
   * Returns true if the state is possible.
   * @returns {boolean} True if the state is possible.
   */
  isPossible() {
    for (let objectFloorPair of this.objectFloorPairs) {
      if (objectFloorPair.microchip != objectFloorPair.generator && this.objectFloorPairs.find(e => e.generator == objectFloorPair.microchip))
        return false;
    }
    return true;
  }

  /**
   * Returns a hash representation of a state.
   * @returns {string} Hash representation of a state.
   */
  hash() {
    return `${this.elevatorFloor}${this.objectFloorPairs
      .slice()
      // Sort object pairs to exclude identical states
      .sort((a, b) => a.generator - b.generator != 0 ? a.generator - b.generator : a.microchip - b.microchip)
      .map(e => `${e.generator}${e.microchip}`).join("")}`;
  }
}