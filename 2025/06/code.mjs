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
    * @returns {Problem[]} Problems.
    */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let lines = input.split(/\r?\n/).filter(e => e != "");

    // Check that all lines have the same length
    if (lines.length == 0 || !lines.every(e => e.length == lines[0].length))
      throw new Error("Invalid input data");

    // Transpose the input
    let transposedLineArray = lines[0].split("").map((e, characterIndex) => lines.map(line => line[characterIndex]));

    // Create problem blocks
    let problemBlocks = transposedLineArray.reduce((acc, line, index) => {
      if (line.every(e => e == " "))
        acc.push([]);
      else
        acc[acc.length - 1].push(line);
      return acc;
    }, [[]]).filter(e => e.length > 0);

    // Parse problems
    let problems = problemBlocks.map((block, blockIndex) => {
      let problem = new Problem();
      for (let i = 0; i < block.length; i++) {
        if (i == 0) {
          if (block[i][block[i].length - 1] != "+" && block[i][block[i].length - 1] != "*")
            throw new Error(`Invalid data in problem ${blockIndex + 1}`);
          problem.operation = block[i][block[i].length - 1];
          problem.rowNumbers = block[i].slice(0, -1).map(e => e == " " ? 0 : parseInt(e));
          problem.columnNumbers.push(block[i].slice(0, -1).reduce((acc, e) => e == " " ? acc : acc * 10 + parseInt(e), 0));
        }
        else {
          if (block[i][block[i].length - 1] != " ")
            throw new Error(`Invalid data in problem ${blockIndex + 1}`);
          for (let j = 0; j < block[i].length - 1; j++)
            problem.rowNumbers[j] = block[i][j] == " " ? problem.rowNumbers[j] : problem.rowNumbers[j] * 10 + parseInt(block[i][j]);
          problem.columnNumbers.unshift(block[i].slice(0, -1).reduce((acc, e) => e == " " ? acc : acc * 10 + parseInt(e), 0));
        }
      }
      return problem;
    });

    consoleLine.innerHTML += " done.";
    return problems;
  }

  /**
   * Finds the sum of problem answers.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of problem answers.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let problems = this.parse(input);
      if (part == 2)
        problems.reverse();
      
      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let answerSum = 0;
      for (let problem of problems) {
        let problemNumbers = part == 1 ? problem.rowNumbers : problem.columnNumbers;
        let answer = problemNumbers[0];
        for (let i = 1; i < problemNumbers.length; i++) {
          if (problem.operation == "+")
            answer += problemNumbers[i];
          if (problem.operation == "*")
            answer *= problemNumbers[i];
        }

        answerSum += answer;

        if (visualization)
          visConsole.addLine(`${problemNumbers.join(" " + problem.operation + " ")} = <span class="highlighted">${answer}</span>`);
      }

      return answerSum;
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
 * Puzzle problem class.
 */
class Problem {
  /**
   * @param {number[]} rowNumbers Row numbers.
   * @param {number[]} columnNumbers Column numbers.
   * @param {string} operation Operation.
   */
  constructor(rowNumbers = [], columnNumbers = [], operation = null) {
    /**
     * Row numbers.
     * @type {number[]}
     */
    this.rowNumbers = rowNumbers;
    /**
     * Column numbers.
     * @type {number[]}
     */
    this.columnNumbers = columnNumbers;
    /**
     * Operation.
     * @type {string}
     */
    this.operation = operation;
  }
}