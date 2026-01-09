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
   * @returns {Program[]} Programs.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let programs = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match = line.match(/^(\d+) <-> (\d+(, \d+)*)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      let program = programs.find(e => e.id == parseInt(match[1]));
      if (program == undefined)
        programs.push(program = new Program(parseInt(match[1])));
      
      for (let connectedProgramId of match[2].split(", ").map(e => parseInt(e))) {
        let connectedProgram = programs.find(e => e.id == connectedProgramId);
        if (connectedProgram == undefined)
          programs.push(connectedProgram = new Program(connectedProgramId));
        program.connections.push(connectedProgram);
        connectedProgram.connections.push(program);
      }
    });

    consoleLine.innerHTML += " done.";
    return programs;
  }

  /**
   * Finds the number of programs in the group that contains program ID 0 (part 1) or the number of program groups (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of programs in the group that contains program ID 0 (part 1) or the number of program groups (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let programs = this.parse(input).sort((a, b) => a - b);
      if (programs[0].id != 0)
        throw new Error("Program 0 not found");

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let addGroupIdsToSet = (program, idSet) => {
        if (!idSet.has(program.id)) {
          idSet.add(program.id);
          program.connections.forEach(e => addGroupIdsToSet(e, idSet));
        }
      }
 
      let groups = [];
      while (programs.length > 0) {
        let idSet = new Set();
        addGroupIdsToSet(programs[0], idSet);
        groups.push(programs.filter(e => idSet.has(e.id)).sort((a, b) => a - b));
        programs = programs.filter(e => !idSet.has(e.id));
      }

      if (visualization) {
        if (part == 1)
          visConsole.addLine(`Group (<span class="highlighted">${groups[0].length}</span> program${groups.length == 1 ? "" : "s"}): ${groups[0].map(e => e.id).join(", ")}.`);
        else {
          for (let i = 0; i < groups.length; i++) {
            visConsole.addLine(`Group ${i + 1}: ${groups[i].map(e => e.id).join(", ")}.`);
            visConsole.addLine();
          }
        }
      }

      return part == 1 ? groups[0].length : groups.length;
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
 * Puzzle program class.
 */
class Program {
  /**
   * @param {number} id ID.
   */
  constructor(id) {
    /**
     * ID.
     * @type {number}
     */
    this.id = id;
    /**
     * Connections.
     * @type {Program[]}
     */
    this.connections = [];
  }
}