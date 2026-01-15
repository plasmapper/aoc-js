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
    this.noPart2 = true;
  }
  
  /**
   * Parses the puzzle input.
   * @param {string} input Puzzle input.
   * @returns {{
   * startState: string,
   * numberOfSteps: number,
   * stateRules: object<string,Rule>,
   * }} Replacements and medicine molecule.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let blocks = input.trim().split(/\r?\n\r?\n/);
    if (blocks.length < 2)
      throw new Error("Invalid input data");

    let headerLines = blocks[0].split(/\r?\n/);
    if (headerLines.length != 2)
      throw new Error("Invalid header");
    let match = headerLines[0].match(/^Begin in state ([A-Z]).$/);
    if (match == null)
      throw new Error("Invalid initial state");
    let startState = match[1];
    match = headerLines[1].match(/^Perform a diagnostic checksum after (\d+) steps?.$/);
    if (match == null)
      throw new Error("Invalid number of steps state");
    let numberOfSteps = parseInt(match[1]);
    
    let stateRules = {};

    blocks.slice(1).forEach((block, blockIndex) => {
      let blockLines = block.split(/\r?\n/).map(e => e.trim());
      if (blockLines.length != 9)
        throw new Error(`Invalid data in rule ${blockIndex + 1}`);
      match = blockLines[0].match(/^In state ([A-Z]):$/)
      if (match == null)
        throw new Error(`Invalid data in rule ${blockIndex + 1} line 1`);
      let ruleState = match[1];
      if (ruleState in stateRules)
        throw new Error(`Rule for state ${ruleState} is defined more than once`);

      let valuesToWrite = [], moves = [], nextStates = [];
      if (blockLines[1] != "If the current value is 0:")
        throw new Error(`Invalid data in rule ${blockIndex + 1} line 2`);
      match = blockLines[2].match(/^- Write the value (0|1).$/);
      if (match == null)
        throw new Error(`Invalid data in rule ${blockIndex + 1} line 3`);
      valuesToWrite.push(parseInt(match[1]));
      match = blockLines[3].match(/^- Move one slot to the (left|right).$/);
      if (match == null)
        throw new Error(`Invalid data in rule ${blockIndex + 1} line 4`);
      moves.push(parseInt(match[1] == "left" ? -1 : 1));
      match = blockLines[4].match(/^- Continue with state ([A-Z]).$/);
      if (match == null)
        throw new Error(`Invalid data in rule ${blockIndex + 1} line 5`);
      nextStates.push(match[1]);

      if (blockLines[5] != "If the current value is 1:")
        throw new Error(`Invalid data in rule ${blockIndex + 1} line 6`);
      match = blockLines[6].match(/^- Write the value (0|1).$/);
      if (match == null)
        throw new Error(`Invalid data in rule ${blockIndex + 1} line 7`);
      valuesToWrite.push(parseInt(match[1]));
      match = blockLines[7].match(/^- Move one slot to the (left|right).$/);
      if (match == null)
        throw new Error(`Invalid data in rule ${blockIndex + 1} line 8`);
      moves.push(parseInt(match[1] == "left" ? -1 : 1));
      match = blockLines[8].match(/^- Continue with state ([A-Z]).$/);
      if (match == null)
        throw new Error(`Invalid data in rule ${blockIndex + 1} line 9`);
      nextStates.push(match[1]);

      stateRules[ruleState] = new Rule(valuesToWrite, moves, nextStates);
    });

    consoleLine.innerHTML += " done.";
    return {startState, numberOfSteps, stateRules};
  }

  /**
   * Finds the diagnostic checksum.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Diagnostic checksum.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {startState, numberOfSteps, stateRules} = this.parse(input);
      
      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let onePositions = new Set(), position = 0, state = startState;
      for (let i = 0; i < numberOfSteps; i++) {
        let rule = stateRules[state];
        if (rule == undefined)
          throw new Error(`Invalid state ${state}`);
        if (!onePositions.has(position)) {
          if (rule.valuesToWrite[0] == 1)
            onePositions.add(position);
          position += rule.moves[0];
          state = rule.nextStates[0];
        }
        else {
          if (rule.valuesToWrite[1] == 0)
            onePositions.delete(position);
          position += rule.moves[1];
          state = rule.nextStates[1];
        }
      }

      let numberOfOnes = onePositions.size;
      if (visualization)
        visConsole.addLine(`After ${numberOfSteps} step${numberOfSteps == 1 ? "" : "s"} "1" appears <span class="highlighted">${numberOfOnes}</span> time${numberOfOnes == 1 ? "" : "s"} on the tape.`);

      return numberOfOnes;
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
 * Puzzle rule class.
 */
class Rule {
  /**
   * @param {number[]} valuesToWrite Values to write if current value is 0 or 1.
   * @param {number[]} moves Moves if current value is 0 or 1.
   * @param {string[]} nextStates Next states if current value is 0 or 1.
   */
  constructor(valuesToWrite, moves, nextStates) {
    /**
     * Values to write if current value is 0 or 1.
     * @type {number[]}
     */
    this.valuesToWrite = valuesToWrite;
    /**
     * Moves if current value is 0 or 1.
     * @type {number[]}
     */
    this.moves = moves;
    /**
     * Next states if current value is 0 or 1.
     * @type {string[]}
     */
    this.nextStates = nextStates;
  }
}