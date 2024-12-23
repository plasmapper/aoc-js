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
   * @returns {Computer[]} Computers.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let computers = [];
  
  input.trim().split(/\r?\n/).forEach((line, lineIndex) => {
    let match;
    if ((match = line.match(/^([a-z][a-z])-([a-z][a-z])$/)) == null)
      throw new Error(`Invalid data in line ${lineIndex + 1}`);
    let name1 = match[1];
    let name2 = match[2];

    let computer1, computer2;
    if ((computer1 = computers.find(c => c.name == name1)) == undefined)
      computers.push(computer1 = new Computer(name1));
    if ((computer2 = computers.find(c => c.name == name2)) == undefined)
      computers.push(computer2 = new Computer(name2));

    if (computer1.connections.find(c => c.name == name2) == undefined)
      computer1.connections.push(computer2);
    if (computer2.connections.find(c => c.name == name1) == undefined)
      computer2.connections.push(computer1);
  });

  consoleLine.innerHTML += " done.";
  return computers;
}

  /**
   * Finds the number of computer groups of 3 that contain a computer with a name starting with "t" (part 1) or finds the largest group of computers (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number|string} Number of computer groups of 3 that contain a computer with a name starting with "t" (part 1) or names of computers in the largest group (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let computers = this.parse(input);

      // Computer group map (key: computer names as a single string, value: array of computers sorted by name)
      let computerGroupMap = new Map();
      for (let computer of computers)
        computerGroupMap.set(computer.name, [computer]);

      // Find all groups of 3 computers (part 1) or the group of the maximum size (part 2)
      for (let i = 0, newComputerGroupMap = computerGroupMap; newComputerGroupMap.size > 0 && (part != 1 || i < 3); i++) {
        computerGroupMap = newComputerGroupMap;
        newComputerGroupMap = new Map();
        for (let computerGroup of computerGroupMap.values()) {
          // Check all connections of the first computer in the group
          for (let computer of computerGroup[0].connections) {
            // If a connected computer is connected to all computers in the group, create a new group
            if (computerGroup.reduce((acc, c) => acc && computer.connections.includes(c), true)) {
              let newComputerGroup = computerGroup.slice();
              newComputerGroup.push(computer);
              newComputerGroup.sort((c1, c2) => c1.name > c2.name ? 1 : (c1.name < c2.name ? -1 : 0));
              let newComputerNames = newComputerGroup.reduce((acc, c) => acc + c.name, "");
              newComputerGroupMap.set(newComputerNames, newComputerGroup);
            }
          }              
        }
      }

      // Return the number of computer groups of 3 that contain a computer with a name starting with "t" (part 1)
      if (part == 1) {
        let computerGroupsWithT = [];
        for (let computers of computerGroupMap.values()) {
          if (computers.find(c => c.name[0] == "t") != undefined)
            computerGroupsWithT.push(computers);
        }
        
        if (visualization) {
          let visConsole = new Console();
          this.visContainer.append(visConsole.container);
    
          for (let computerGroup of computerGroupsWithT) {
            let computerNames = [];
            for (let computer of computerGroup)
              computerNames.push(computer.name[0] == "t" ? `<span class="highlighted">${computer.name}</span>` : computer.name);
            visConsole.addLine(computerNames.join(","));
          }
        }

        return computerGroupsWithT.length;
      }

      // Return the names of computers in the largest group (part 2)
      else
        return computerGroupMap.values().next().value.map(c => c.name).join(",");
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
 * Puzzle computer class.
 */
class Computer {
  /**
   * @param {string} name Name.
   */
  constructor(name) {
    /**
     * Name.
     * @type {string}
     */
    this.name = name;
    /**
     * Connections.
     * @type {Computer[]}
     */
    this.connections = [];
  }
}