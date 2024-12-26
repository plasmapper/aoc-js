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
   * @returns {*} Packets.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let packets = input.trim().split(/\r?\n/).filter(line => line != "").map((line, index) => {
      if (!/^\[.*\]$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      try {
        return JSON.parse(line);
      }
      catch {
        throw new Error(`Invalid data in line ${index + 1}`);
      }
    });

    if (packets.length % 2)
      throw new Error(`Invalid number of packets`);

    consoleLine.innerHTML += " done.";
    return packets;
  }

  /**
   * Calculates the sum of the indices of packet pairs that are in the right order (part 1) or the decoder key (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The sum of the indices of packet pairs that are in the right order (part 1) or the decoder key (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;
      
      let packets = this.parse(input);

      let visConsole = new Console();

      if (visualization)
        this.visContainer.append(visConsole.container);

      // Compare packet pairs 
      if (part == 1) {
        let indexSum = 0;

        if (visualization) {
          for (let i = 0; i < packets.length; i += 2) {
            visConsole.addLine(JSON.stringify(packets[i]));
            visConsole.addLine();
            visConsole.addLine(JSON.stringify(packets[i + 1]));
            visConsole.addLine();
            visConsole.addLine("--------------------------------");
            visConsole.addLine();
          }
        }

        for (let index = 1; index <= packets.length / 2; index++) {
          if (this.isStopping)
            return;

          if (this.compareValues(packets[(index - 1) * 2], packets[(index - 1) * 2 + 1]) < 0) {
            if (visualization) {
              visConsole.lines[(index - 1) * 6].classList.add("highlighted");
              visConsole.lines[(index - 1) * 6 + 2].classList.add("highlighted");
            }
            indexSum += index;
          }
        }

        return indexSum;
      }
      // Sort packets and find the indices of divider packets
      else {
        let dividerPacket1 = [[2]];
        let dividerPacket2 = [[6]];
        packets.push(dividerPacket1, dividerPacket2);        
        packets.sort((v1, v2) => this.compareValues(v1, v2));

        let dividerPacket1Index = packets.indexOf(dividerPacket1) + 1;
        let dividerPacket2Index = packets.indexOf(dividerPacket2) + 1;

        if (visualization) {
          packets.forEach(e => {visConsole.addLine(JSON.stringify(e)); visConsole.addLine();});
          visConsole.lines[(dividerPacket1Index - 1) * 2].classList.add("highlighted");
          visConsole.lines[(dividerPacket2Index - 1) * 2].classList.add("highlighted");
        }

        return dividerPacket1Index * dividerPacket2Index;
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

  /**
   * Compares values.
   * @param {*} value1 
   * @param {*} value2 
   * @returns {number} 0 if the values are equal, -1 if the values are in the right order, 1 if the values are not in the right order.
   */
  compareValues(value1, value2) {
    if (Number.isInteger(value1) && Number.isInteger(value2))
      return value1 == value2 ? 0 : (value1 < value2 ? -1 : 1);

    if (Array.isArray(value1) && Number.isInteger(value2))
      return this.compareValues(value1, [value2]);

    if (Number.isInteger(value1) && Array.isArray(value2))
      return this.compareValues([value1], value2);

    if (Array.isArray(value1) && Array.isArray(value2)) {
      let compareResult;
      for (let i = 0; i < Math.min(value1.length, value2.length); i++) {
        if ((compareResult = this.compareValues(value1[i], value2[i])) != 0)
          return compareResult;
      }

      return value1.length == value2.length ? 0 : (value1.length < value2.length ? -1 : 1);
    }

    throw new Error(`Value "${JSON.stringify(value1)}" and/or "${JSON.stringify(value2)}" is invalid.`);
  }
}
