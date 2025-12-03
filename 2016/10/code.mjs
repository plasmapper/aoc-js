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
   * bots: Bot[],
   * outputs: Value[]
   * }} Bots and outputs.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let bots = [];
    let outputs = [];

    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match;
      if ((match = line.match(/^value (\d+) goes to bot (\d+)$/)) != null) {
        let value = parseInt(match[1]);
        let botIndex = parseInt(match[2]);
        if (bots[botIndex] == undefined)
          bots[botIndex] = new Bot();
        bots[botIndex].values.push(new Value(null, value));
      }
      else if ((match = line.match(/^bot (\d+) gives low to (bot|output) (\d+) and high to (bot|output) (\d+)$/)) != null) {
        let botIndex = parseInt(match[1]);
        if (bots[botIndex] == undefined)
          bots[botIndex] = new Bot();
        let lowDestinationIndex = parseInt(match[3]);
        let highDestinationIndex = parseInt(match[5]);
        if (match[2] == "bot") {
          if (bots[lowDestinationIndex] == undefined)
            bots[lowDestinationIndex] = new Bot();
          bots[lowDestinationIndex].values.push(bots[botIndex].lowValue);
        }
        if (match[2] == "output") {
          if (outputs[lowDestinationIndex] == undefined)
            outputs[lowDestinationIndex] = bots[botIndex].lowValue;
          else
            throw new Error(`Output ${lowDestinationIndex} is defined more than once`);
        }
        if (match[4] == "bot") {
          if (bots[highDestinationIndex] == undefined)
            bots[highDestinationIndex] = new Bot();
          bots[highDestinationIndex].values.push(bots[botIndex].highValue);
        }
        if (match[4] == "output") {
          if (outputs[highDestinationIndex] == undefined)
            outputs[highDestinationIndex] = bots[botIndex].highValue;
          else
            throw new Error(`Output ${lowDestinationIndex} is defined more than once`);
        }
      }
      else
        throw new Error(`Invalid instruction ${index + 1}`);
    });

    for (let i = 0; i < bots.length; i++) {
      if (bots[i].values.length != 2)
        throw new Error(`Bot ${i} has ${bots[i].values.length} value sources`);
    }

    for (let i = 0; i < 3; i++) {
      if (outputs[i] == undefined)
        throw new Error(`Output ${i} not found`);
    }

    consoleLine.innerHTML += " done.";
    return {bots, outputs};
  }

  /**
   * Finds the number of the bot that is responsible for comparing value-61 microchips with value-17 microchips (part 1) or the product of values in outputs 0, 1 and 2 (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of the bot that is responsible for comparing value-61 microchips with value-17 microchips (part 1) or the product of values in outputs 0, 1 and 2 (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {bots, outputs} = this.parse(input);
      let requiredValuesToCompare = bots.length < 10 ? [2, 5] : [17, 61];
      let numberOfOutputsToMultiply = 3;

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Find compared values for all bots
      for (let bot of bots)
        bot.findValues();

      // Find the bot that is responsible for comparing the required values
      let requiredBotIndex = bots.findIndex(bot => bot.lowValue.value == requiredValuesToCompare[0] && bot.highValue.value == requiredValuesToCompare[1]);
      if (requiredBotIndex < 0)
        throw new Error(`Bot that is responsible for comparing ${requiredValuesToCompare[0]} with ${requiredValuesToCompare[1]} not found`);

      // Find the product of the output values
      let productOfOutputValues = 1;
      for (let i = 0; i < numberOfOutputsToMultiply; i++) {
        if (outputs[i].value == null)
          throw new Error(`Output ${i} value is undefined`);
        productOfOutputValues *= outputs[i].value;
      }

      if (visualization) {
        for (let i = 0; i < bots.length; i++) {
          if (bots[i] != undefined)
            visConsole.addLine(`Bot ${i} compares ${bots[i].lowValue.value} with ${bots[i].highValue.value}.`);
        }

        visConsole.addLine();

        for (let i = 0; i < outputs.length; i++) {
          if (outputs[i] != undefined)
            visConsole.addLine(`Output ${i}: ${outputs[i].value}.`);
        }

        if (part == 1) {
          let line = visConsole.lines.find(line => line.innerHTML.includes(`Bot ${requiredBotIndex}`));
          line.classList.add("highlighted");
          visConsole.container.scrollTop = line.offsetTop - visConsole.container.offsetHeight / 2;
        }
        else {
          for (let i = 0; i < numberOfOutputsToMultiply; i++) {
            let line = visConsole.lines.find(line => line.innerHTML.includes(`Output ${i}`));
            line.classList.add("highlighted");
            if (i == 0)
              visConsole.container.scrollTop = line.offsetTop - visConsole.container.offsetHeight / 2;
          }
        }
      }

      return part == 1 ? requiredBotIndex : productOfOutputValues;
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
 * Puzzle value class.
 */
class Value {
  /**
   * @param {Bot} bot Bot.
   * @param {number} value Value.
   */
  constructor(bot, value) {
    /**
     * Bot.
     * @type {Bot}
     */
    this.bot = bot;
    /**
     * Value.
     * @type {number}
     */
    this.value = value;
  }
}

/**
 * Puzzle bot class.
 */
class Bot {
  constructor() {
    /**
     * Low value.
     * @type {Value}
     */
    this.lowValue = new Value(this, null);
    /**
     * High value.
     * @type {Value}
     */
    this.highValue = new Value(this, null);
    /**
     * Values.
     * @type {Value[]}
     */
    this.values = [];
  }

  /**
   * Finds the bot values.
   */
  findValues() {
    if (this.values[0].value == null)
      this.values[0].bot.findValues();
    if (this.values[1].value == null)
      this.values[1].bot.findValues();
    this.lowValue.value = Math.min(this.values[0].value, this.values[1].value);
    this.highValue.value = Math.max(this.values[0].value, this.values[1].value);
  }
}