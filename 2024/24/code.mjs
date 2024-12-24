import { delay, Console, Vector2D } from "../../utility.mjs";

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
   * wires: Map<string, number>,
   * gates: Gate[]
   * }} Wires and gates.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let wires = new Map();
  let gates = [];
  let parsingWires = true;

  input.trim().split(/\r?\n/).forEach((line, lineIndex) => {
    line = line.trim();
    let match;
    if (line == "")
      parsingWires = false;
    else {
      if (parsingWires) {
        if ((match = line.match(/^([xy]\d+): ([01])$/)) == null)
          throw new Error(`Invalid data in line ${lineIndex + 1}`);
        wires.set(match[1], parseInt(match[2]))
      }
      else {
        if ((match = line.match(/^([a-z0-9]+) (AND|OR|XOR) ([a-z0-9]+) -> ([a-z0-9]+)$/)) == null)
          throw new Error(`Invalid data in line ${lineIndex + 1}`);
        let gate = new Gate([match[1], match[3]], match[4], match[2]);
        gates.push(gate);
        if (!wires.has(gate.inputs[0]))
          wires.set(gate.inputs[0], undefined);
        if (!wires.has(gate.inputs[1]))
          wires.set(gate.inputs[1], undefined);
        if (!wires.has(gate.output))
          wires.set(gate.output, undefined);
      }
    }
  });

  consoleLine.innerHTML += " done.";
  return { wires, gates};
}

  /**
   * Calculates z (part 1) or finds the names of wires that should be swapped to change the system action to z = x + y (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number|string} z (part 1) or names of wires that should be swapped to change the system action to z = x + y (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let { wires, gates } = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Find x, y and z wires
      let xWireNames = [];
      let yWireNames = [];
      let zWireNames = [];

      for (let i = 0, wireName = "x" + i.toString().padStart(2, 0); wires.has(wireName); wireName = "x" + (++i).toString().padStart(2, 0))
        xWireNames.push(wireName);
      for (let i = 0, wireName = "y" + i.toString().padStart(2, 0); wires.has(wireName); wireName = "y" + (++i).toString().padStart(2, 0))
        yWireNames.push(wireName);
      for (let i = 0, wireName = "z" + i.toString().padStart(2, 0); wires.has(wireName); wireName = "z" + (++i).toString().padStart(2, 0))
        zWireNames.push(wireName);

      // Calculate z (part 1)
      if (part == 1) {
        while (gates.length) {
          let newGates = [];
          for (let gate of gates) {
            let value1 = wires.get(gate.inputs[0]);
            let value2 = wires.get(gate.inputs[1]);
            if (value1 != undefined && value2 != undefined) {
              if (gate.operation == "OR")
                wires.set(gate.output, value1 | value2);
              if (gate.operation == "AND")
                wires.set(gate.output, value1 & value2);
              if (gate.operation == "XOR")
                wires.set(gate.output, value1 ^ value2);
            }
            else
              newGates.push(gate);
          }
          if (gates.length == newGates.length)
            throw new Error("Solution not found");

          gates = newGates;
        }

        if (visualization) {
          let wireNamesAndValues = [...wires.entries()].filter(([wireName, wireValue]) => !xWireNames.includes(wireName) && !yWireNames.includes(wireName));
          wireNamesAndValues.sort((e1, e2) => e1[0] > e2[0] ? 1 : (e1[0] < e2[0] ? -1 : 0));

          for (let [wireName, wireValue] of wireNamesAndValues)
            visConsole.addLine(`${wireName}: ${wireValue}`);
        }

        let z = 0;
        for (let i = 0; i < zWireNames.length; i++) {
          let value = wires.get(zWireNames[i]);
          if (value == undefined)
            throw new Error("Solution not found");
          if (value != 0)
            z += Math.pow(2, i);
        }
        return z;
      }

      // Find the names of wires that should be swapped to change the system action to z = x + y (part 2)
      else {
        if (visualization) {
          visConsole.addLine("Solution is based on the assumption that the adder schematic is the following:");
          visConsole.addLine("z_0 = x_0 ^ y_0");
          visConsole.addLine("c_0 = x_0 & y_0");
          visConsole.addLine("z_n = (x_n ^ y_n) ^ c_n-1");
          visConsole.addLine("c_n = (x_n & y_n) | ((x_n ^ y_n) & c_n-1)");
          visConsole.addLine("z_N = c_n-1");
          visConsole.addLine("It is also based on the assumption that wires that should be swapped lead to destinations of incorrect types.");
        }

        if (xWireNames.length != yWireNames.length)
          throw new Error("The number of x bits is not equal to the number of y bits");
        if (zWireNames.length != xWireNames.length + 1)
          throw new Error("The number of z bits is not equal to the number of x and y bits plus 1");
        let bits = xWireNames.length;

        // Find XOR1 and AND1 gates (in correct order)
        let xor1Gates = [];
        let and1Gates = [];
        for (let i = 0; i < bits; i++) {
          let xor1Gate = gates.find(gate => gate.operation == "XOR" && gate.inputs.includes(xWireNames[i]) && gate.inputs.includes(yWireNames[i]));
          xor1Gates.push(xor1Gate);
          let and1Gate = gates.find(gate => gate.operation == "AND" && gate.inputs.includes(xWireNames[i]) && gate.inputs.includes(yWireNames[i]));
          and1Gates.push(and1Gate);
          if (xor1Gate == undefined || and1Gate == undefined)
            throw new Error("Solution not found");
        }

        // Find XOR2, AND2 and OR gates (without order)
        let xor2Gates = gates.filter(gate => gate.operation == "XOR" && !xor1Gates.includes(gate));
        let and2Gates = gates.filter(gate => gate.operation == "AND" && !and1Gates.includes(gate));
        let orGates = gates.filter(gate => gate.operation == "OR");

        let wiresToSwap = new Set();

        // Find XOR1 outputs that do not lead to XOR2 and AND2 (or Z0).
        for (let i = 0; i < xor1Gates.length; i++) {
          let xor1Gate = xor1Gates[i];
          if (i == 0) {
            if (xor1Gate.output != zWireNames[0])
              wiresToSwap.add(xor1Gate.output, zWireNames[0]);
          }
          else {
            if (xor2Gates.find(xor2Gate => xor2Gate.inputs.includes(xor1Gate.output)) == undefined || and2Gates.find(and2Gate => and2Gate.inputs.includes(xor1Gate.output)) == undefined)
              wiresToSwap.add(xor1Gate.output);
          }
        }

        // Find AND1 outputs that do not lead to OR (or XOR2 and AND 2 of bit 1).
        for (let i = 0; i < and1Gates.length; i++) {
          let and1Gate = and1Gates[i];
          if (i == 0) {
            if (xor2Gates.find(xor2Gate => xor2Gate.inputs.includes(and1Gate.output)) == undefined || and2Gates.find(and2Gate => and2Gate.inputs.includes(and1Gate.output)) == undefined)
              wiresToSwap.add(and1Gate.output);
          }
          if (i > 0) {
            if (orGates.find(orGate => orGate.inputs.includes(and1Gate.output)) == undefined)
              wiresToSwap.add(and1Gate.output);
          }
        }

        // Find XOR2 outputs that do not lead to Z.
        for (let xor2Gate of xor2Gates) {
          if (!zWireNames.includes(xor2Gate.output))
            wiresToSwap.add(xor2Gate.output);
        }
        
        // Find AND2 outputs that do not lead to OR.
        for (let and2Gate of and2Gates) {
          if (orGates.find(orGate => orGate.inputs.includes(and2Gate.output)) == undefined)
            wiresToSwap.add(and2Gate.output);
        }

        // Find OR outputs that do not lead to XOR2 and AND2.
        for (let orGate of orGates) {
          if ((xor2Gates.find(xor2Gate => xor2Gate.inputs.includes(orGate.output)) == undefined || and2Gates.find(and2Gate => and2Gate.inputs.includes(orGate.output)) == undefined)
            && orGate.output != zWireNames[bits])
            wiresToSwap.add(orGate.output);
        }

        if (wiresToSwap.size != 8)
          throw new Error("Soultion not found");

        wiresToSwap = [...wiresToSwap];
        wiresToSwap.sort();

        if (visualization)
          visConsole.addLine(`\nWires that should be swapped:\n${wiresToSwap.join(",")}.`);

        return wiresToSwap.join(",");
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
 * Puzzle gate class.
 */
class Gate {
  /**
   * @param {string[]} inputs Inputs.
   * @param {string} output Output.
   * @param {string} operation Operation.
   */
  constructor(inputs, output, operation) {
    /**
     * Inputs.
     * @type {string[]}
     */
    this.inputs = inputs;
    /**
     * Output.
     * @type {string}
     */
    this.output = output;
    /**
     * Operation.
     * @type {string}
     */
    this.operation = operation;
  }
}