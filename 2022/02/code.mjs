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
   * @returns {number[][]} Rounds as an array of pairs of (move, move/outcome) indexes.
   */
  parse(input) {
    const column1Symbols = ["A", "B", "C"];
    const column2Symbols = ["X", "Y", "Z"];

    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let rounds = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      if (!/^[ABC] [XYZ]$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      rounds.push ([column1Symbols.indexOf(line[0]), column2Symbols.indexOf(line[2])]);
    });
    
    consoleLine.innerHTML += " done.";
    return rounds;
  }

  /**
   * Calculates the total score.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Total score.
   */
  async solve(part, input, visualization) {
    const visMoveStrings = ["Rock    ", "Paper   ", "Scissors"];
    const visOutcomeStrings = ["Lose    ", "Draw    ", "Win     "];
  
    try {
      this.isSolving = true;

      let rounds = this.parse(input);
      let column2IsMove = part == 1;

      let visConsole = new Console();
      
      let totalScore = 0;
  
      if (visualization) {
        this.visContainer.append(visConsole.container);
        for (let round of rounds)
          visConsole.addLine(`${visMoveStrings[round[0]]} ${column2IsMove ? visMoveStrings[round[1]] : visOutcomeStrings[round[1]]}`);
      }
  
      for (let [roundIndex, round] of rounds.entries()) {
        if (this.isStopping)
          return;
  
        let score = 0;
        let outcome = (round[1] - round[0] + 4) % 3;
        let move = (round[0] + round[1] + 2) % 3;
  
        if (column2IsMove)
          score = round[1] + 1 + (outcome == 0 ? 0 : (outcome == 1 ? 3 : 6));
        else
          score = move + 1 + (round[1] == 0 ? 0 : (round[1] == 1 ? 3 : 6));
  
        totalScore += score;
    
        if (visualization)
          visConsole.lines[roundIndex].innerHTML += ` ${column2IsMove ? visOutcomeStrings[outcome] : visMoveStrings[move]} ${score}`;
      }
      
      return totalScore;
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