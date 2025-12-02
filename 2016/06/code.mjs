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
   * @returns {string[]} Messages.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let messageSize = null;
    let messages = input.trim().split(/\r?\n/).map((line, index) => {
      if (messageSize == null)
        messageSize = line.length;
      if (line.length == 0 || line.length != messageSize)
        throw new Error(`Invalid length of line ${index + 1}`);
      return line;
    });

    consoleLine.innerHTML += " done.";
    return messages;
  }

  /**
   * Finds the error-corrected message.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {string} Error-corrected message.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let messages = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let correctMessage = "";

      for (let i = 0; i < messages[0].length; i++) {
        let numbersOfLetters = {};
        for (let message of messages) {
          if (!(message[i] in numbersOfLetters))
            numbersOfLetters[message[i]] = 1;
          else
            numbersOfLetters[message[i]]++;
        }

        let correctLetter = "";
        if (part == 1) {
          correctLetter = Object.keys(numbersOfLetters)
            .reduce((acc, key) => numbersOfLetters[key] > acc.number ? {letter: key, number: numbersOfLetters[key]} : acc, {letter: "", number: Number.NEGATIVE_INFINITY})
            .letter;
        }
        else {
          correctLetter = Object.keys(numbersOfLetters)
            .reduce((acc, key) => numbersOfLetters[key] < acc.number ? {letter: key, number: numbersOfLetters[key]} : acc, {letter: "", number: Number.POSITIVE_INFINITY})
            .letter;
        }

        correctMessage += correctLetter;
      }

      if (visualization) {
        for (let message of messages) {
          let visConsoleString = "";
          for (let i = 0; i < message.length; i++)
            visConsoleString += `<span${message[i] == correctMessage[i] ? " class='highlighted'" : ""}>${message[i]}</span>`;
          visConsole.addLine(visConsoleString);
        }
      }

      return correctMessage;
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