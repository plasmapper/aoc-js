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
   * @returns {Monkey[]} Monkeys.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let monkeys;
    input.trim().split(/\r?\n\r?\n/).map((block, blockIndex, blocks) => {
      if (blockIndex == 0)
        monkeys = new Array(blocks.length).fill(0).map(e => new Monkey());
      let monkey = monkeys[blockIndex];

      let lines = block.split(/\r?\n/);

      if (lines.length != 6)
        throw new Error(`Invalid number of lines in block ${blockIndex + 1}`);
      
      if (lines[0] != `Monkey ${blockIndex}:`)
        throw new Error(`Invalid data in block ${blockIndex + 1} line 1`);
      
      let match = lines[1].match(/^  Starting items:((,? \d+)+)$/);
      if (match == null)
        throw new Error(`Invalid data in block ${blockIndex + 1} line 2`);
      monkey.items = match[1].replaceAll(",", "").trim().split(" ").map(e => parseInt(e));

      if ((match = lines[2].match(/^  Operation: new = (old ([\+*]) (old|\d+))$/)) == null)
        throw new Error(`Invalid data in block ${blockIndex + 1} line 3`);
      if (match[3] == "old")
        monkey.operation = match[2] == "+" ? (old => old + old) : (old => old * old);
      else {
        let argument = parseInt(match[3]);
        monkey.operation = match[2] == "+" ? (old => old + argument) : (old => old * argument);
      }

      if ((match = lines[3].match(/^  Test: divisible by (\d+)$/)) == null)
        throw new Error(`Invalid data in ${blockIndex + 1} line 4`);
      monkey.divisor = parseInt(match[1]);

      if ((match = lines[4].match(/^    If true: throw to monkey (\d+)$/)) == null || parseInt(match[1]) < 0 || parseInt(match[1]) >= monkeys.length)
        throw new Error(`Invalid data in ${blockIndex + 1} line 5`);
      monkey.destMonkeyOnTrue = monkeys[parseInt(match[1])];

      if ((match = lines[5].match(/^    If false: throw to monkey (\d+)$/)) == null || parseInt(match[1]) < 0 || parseInt(match[1]) >= monkeys.length)
        throw new Error(`Invalid data in ${blockIndex + 1} line 6`);
      monkey.destMonkeyOnFalse = monkeys[parseInt(match[1])];

      return monkey;
    });

    let commonDivisor = monkeys.reduce((acc, e) => acc * e.divisor, 1);
    for (let monkey of monkeys)
      monkey.commonDivisor = commonDivisor;

    consoleLine.innerHTML += " done.";
    return monkeys;
  }

  /**
   * Calculates the level of monkey business.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The level of monkey business.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let monkeys = this.parse(input);
      let numberOfRounds = part == 1 ? 20 : 10000;
      let levelOfMonkeyBusiness = 0;

      let visConsole = new Console();
      
      if (visualization)
        this.visContainer.append(visConsole.container);

      for (let round = 1; round <= numberOfRounds; round++) {
        if (this.isStopping)
          return;
        
        for (let monkey of monkeys)
          monkey.inspectItems(part == 1);

        let numbersOfInspectedItems = monkeys.map(e => e.numberOfInspectedItems);
        numbersOfInspectedItems.sort((n1, n2) => n2 - n1);
        levelOfMonkeyBusiness = numbersOfInspectedItems[0] * numbersOfInspectedItems[1];

        if (visualization && (round == 1 || round == numberOfRounds || numberOfRounds < 100 || round % 100 == 0)) {
          visConsole.addLine(`Round ${round}: ${monkeys.map(e => e.numberOfInspectedItems).join(", ")}.\nLevel: ${levelOfMonkeyBusiness}.`);
          visConsole.addLine();
        }
      }

      return levelOfMonkeyBusiness;
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
 * Puzzle monkey class
 */
class Monkey {
  constructor() {
    /**
     * Items that the monkey has.
     * @type {number[]}
     */
    this.items = [];
    /**
     * Arithmetic operation with a worry level.
     * @type {function}
     */
    this.operation;
    /**
     * Test divisor.
     * @type {number}
     */
    this.divisor = 0;
    /**
     * Common divisor across all monkeys.
     * @type {number}
     */
    this.commonDivisor = 0;
    /**
     * Monkey to throw the item to if the operation result is divisible by the divisor.
     * @type {Monkey}
     */
    this.destMonkeyOnTrue;
    /**
     * Monkey to throw the item to if the operation result is not divisible by the divisor.
     * @type {Monkey}
     */
    this.destMonkeyOnFalse;
    /**
     * Numb er of items inspected by the monkey.
     * @type {number}
     */
    this.numberOfInspectedItems = 0;
  }
  
  /**
   * Inspects items and throws them to other monkeys.
   * @param {boolean} divideByThree Divide the worry level by three after the operation.
   */
  inspectItems(divideByThree) {
    for (let item of this.items) {
      item = this.operation(item);
      
      if (divideByThree)
        item = Math.floor(item / 3);
      else
        item %= this.commonDivisor;

      if (item % this.divisor == 0)
        this.destMonkeyOnTrue.items.push(item);
      else
        this.destMonkeyOnFalse.items.push(item);
    }

    this.numberOfInspectedItems += this.items.length;
    this.items = [];
  }
}