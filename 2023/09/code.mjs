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
   * @returns {number[][]} Histories.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let histories = [];

    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match = line.match(/^[-\d ]+$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      histories.push(line.split(" ").map(e => parseInt(e)));
    });

    consoleLine.innerHTML += " done.";
    return histories;
  }

  /**
   * Calculates the sum of the predictions.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of the predictions.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let histories = this.parse(input);

      let solConsole = this.solConsole;
      solConsole.addLine(`Number of histories: ${histories.length}.`);
      let solConsoleLine = solConsole.addLine();

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let sumOfPredictions = 0;
      
      for (let [historyIndex, history] of histories.entries()) {
        if (this.isStopping)
          return;

        // First numbers of the history triangle lines
        let lineFirstNumbers = [history[0]];
        // Coefficients for the first line numbers in the current first line number
        let coefficients = [1];

        for (let i = 1; i < history.length; i++) {
          let value = history[i];
          for (let j = 0; j < coefficients.length; j++) {
            coefficients[j] = coefficients[j] * i / (i - j);
            value -= coefficients[j] * lineFirstNumbers[j];
          }
          
          lineFirstNumbers.push(value);
          coefficients.push(1);
        }

        let prediction = 0;
        // Find the next history value
        if (part == 1) {
          for (let i = 0; i < lineFirstNumbers.length; i++) {
            coefficients[i] = coefficients[i] * history.length / (history.length - i);
            prediction += lineFirstNumbers[i] * coefficients[i];
          }
        }
        // Find the previous history value
        else {
          for (let i = lineFirstNumbers.length - 1; i >= 0; i--)
            prediction = lineFirstNumbers[i] - prediction;
        }

        sumOfPredictions += prediction;

        solConsoleLine.innerHTML = `History ${historyIndex + 1} ${part == 1 ? "next" : "previous"} value: ${prediction}.\nSum of predictions: ${sumOfPredictions}.`;

        if (visualization) {
          visConsole.addLine(`History ${historyIndex + 1} ${part == 1 ? "next" : "previous"} value: ${prediction}.`)
          visConsole.container.scrollTop = visConsole.container.scrollHeight;
          await delay(10);
        }
      }

      return sumOfPredictions;
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