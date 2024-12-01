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
   * @returns {string} Trimmed input.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    input = input.trim();

    consoleLine.innerHTML += " done.";
    return input;
  }

  /**
   * Finds the first occurence of the unique character sequence of the required size in the puzzle input.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of characters from the start of the input to the end of the sequence.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      input = this.parse(input);
      let requiredSequenceSize = part == 1 ? 4 : 14;

      let solConsole = this.solConsole;
      let visConsole = new Console();
      let visConsoleLineSpans = [];
      
      solConsole.addLine(`Number of characters: ${input.length}.`);
      let solConsoleLine = solConsole.addLine();
  
      if (visualization) {
        this.visContainer.append(visConsole.container);
        let visConsoleLine = visConsole.addLine();
        visConsoleLine.style["word-break"] = "break-all";
  
        for (let i = 0; i < 3; i++) {
          visConsoleLineSpans.push(document.createElement("span"));
          if (i == 1)
          visConsoleLineSpans[i].classList.add("highlighted");
          visConsoleLine.append(visConsoleLineSpans[i]);
        }
      }
  
      for (let i = 0; i < input.length; i++) {
        if (this.isStopping)
          return;
  
        let sequence = [];
        for (let j = i; j < input.length && sequence.length < requiredSequenceSize && !sequence.includes(input.charAt(j)); j++)
          sequence.push(input.charAt(j));
        
        solConsoleLine.innerHTML = `Start character: ${i + 1}.\nDistinct consecutive characters: ${sequence.length}.`;
  
        if (visualization) {
          visConsole.container.scrollTop = visConsoleLineSpans[1].offsetTop - visConsole.container.offsetHeight / 2;
          visConsoleLineSpans[0].innerHTML = input.substring(0, i);
          visConsoleLineSpans[1].innerHTML = input.substring(i, i + sequence.length);
          visConsoleLineSpans[2].innerHTML = input.substring(i + sequence.length);
          await delay(1);
        }
  
        if (sequence.length >= requiredSequenceSize)
          return i + sequence.length;
      }
      
      throw new Error(`${requiredSequenceSize} distinct consecutive characters not found`);
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