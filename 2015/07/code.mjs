import { delay, Console, linearSystemSolution } from "../../utility.mjs";

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
   * @returns {Wire[]} Wires.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let wires = new Map();
    let getOrAddWire = name => {
      let wire = wires.get(name);
      if (wire == undefined)
        wires.set(name, wire = new Wire(name));
      return wire;
    };

    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match, gateType = "", input1 = null, input2 = null, output = null;
      if ((match = line.match(/^(\d+|[a-z]|[a-z][a-z]) -> ([a-z]|[a-z][a-z])$/)) != null) {
        input1 = /^\d+$/.test(match[1]) ? new Wire("", parseInt(match[1])) : getOrAddWire(match[1]);
        output = getOrAddWire(match[2]);
      }
      else if ((match = line.match(/^NOT ([a-z]|[a-z][a-z]) -> ([a-z]|[a-z][a-z])$/)) != null) {
        input1 = getOrAddWire(match[1]);
        output = getOrAddWire(match[2]);
        gateType = "NOT";
      }
      else if ((match = line.match(/^([a-z]|[a-z][a-z]|\d+) (AND|OR) ([a-z]|[a-z][a-z]|\d+) -> ([a-z]|[a-z][a-z])$/)) != null) {
        input1 = /^\d+$/.test(match[1]) ? new Wire("", parseInt(match[1])) : getOrAddWire(match[1]);
        input2 = /^\d+$/.test(match[3]) ? new Wire("", parseInt(match[3])) : getOrAddWire(match[3]);
        output = getOrAddWire(match[4]);
        gateType = match[2];
      }
      else if ((match = line.match(/^([a-z]|[a-z][a-z]) (LSHIFT|RSHIFT) (\d+) -> ([a-z]|[a-z][a-z])$/)) != null) {
        input1 = getOrAddWire(match[1]);
        input2 = new Wire("", parseInt(match[3]));
        output = getOrAddWire(match[4]);
        gateType = match[2];
      }
      else
        throw new Error(`Invalid data in line ${index + 1}`);

      output.source = new Gate(gateType, input1, input2);
    });

    consoleLine.innerHTML += " done.";
    return [...wires.values()];
  }

  /**
   * Finds the signal provided to wire a.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Signal provided to wire a.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let wires = this.parse(input);
      wires.sort((w1, w2) => w1.name > w2.name ? 1 : (w1.name < w2.name ? -1 : 0));

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let aWire = wires.find(wire => wire.name == "a");
      let bWire = wires.find(wire => wire.name == "b");
      if (aWire == undefined)
        throw new Error(`Wire "a" not found`);
      if (part == 2 && bWire == undefined)
        throw new Error(`Wire "b" not found`);

      for (let wire of wires)
        wire.calculateValue();
      
      if (part == 2) {
        let aWireValue = aWire.value;
        for (let wire of wires)
          wire.value = undefined;
        bWire.source.input1.value = aWireValue;
        for (let wire of wires)
          wire.calculateValue();
      }

      if (visualization) {
        for (let wire of wires) {
          visConsole.addLine(`${wire.name}: ${wire.value}`);
          if (wire == aWire || (part == 2 && wire == bWire))
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
        }
      }

      return aWire.value;
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
 * Puzzle wire class.
 */
class Wire {
  /**
   * @param {string} name Name.
   * @param {number} value Value.
   */
  constructor(name, value) {
    /**
     * Name
     * @type {string}
     */
    this.name = name;
    /**
     * Source.
     * @type {Gate}
     */
    this.source = null;
    /**
     * Value.
     * @type {number}
     */
    this.value = value;
  }

  /**
   * Calculates the wire value.
   * @returns {number} Value.
   */
  calculateValue() {
    if (this.value == undefined) {
      if (this.source == null)
        throw new Error(`Wire ${this.name} value can not be calculated`);
      this.value = this.source.calculateOutputValue();
    }
    return this.value;
  }
}

/**
 * Puzzle gate class.
 */
class Gate {
  /**
   * @param {string} type Type.
   * @param {Wire} input1 Input 1.
   * @param {Wire} input2 Input 2.
   */
  constructor(type, input1, input2) {
    /**
     * Type
     * @type {string}
     */
    this.type = type;
    /**
     * Input 1.
     * @type {Wire}
     */
    this.input1 = input1;
    /**
     * Input 2.
     * @type {Wire}
     */
    this.input2 = input2;
  }

  /**
   * Calculates the gate output value.
   * @returns {number} Value.
   */
  calculateOutputValue() {
    if (this.type == "NOT")
      return this.input1.calculateValue() ^ 0xFFFF;
    if (this.type == "AND")
      return this.input1.calculateValue() & this.input2.calculateValue();
    if (this.type == "OR")
      return this.input1.calculateValue() | this.input2.calculateValue();
    if (this.type == "LSHIFT")
      return (this.input1.calculateValue() << this.input2.calculateValue()) & 0xFFFF;
    if (this.type == "RSHIFT")
      return this.input1.calculateValue() >> this.input2.calculateValue();
    return this.input1.calculateValue();
  }
}