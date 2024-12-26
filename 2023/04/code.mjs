import { delay, Console, Range } from "../../utility.mjs";

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
   * @returns {Card[]} Cards.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let cards = input.trim().split(/\r?\n/).map((line, index) => {
      let match = line.replaceAll(/\s+/g, " ").match(/^Card (\d+):(.+)\|(.+)$/);
      if (match == null || parseInt(match[1]) != index + 1)
        throw new Error(`Invalid data in line ${index + 1}`);
      
      let card = new Card();
      match[2].trim().split(" ").forEach(e => {
        e = parseInt(e);
        if (isNaN(e))
          throw new Error(`Invalid data in line ${index + 1}`);
        card.winningNumbers.push(e);
      });
      match[3].trim().split(" ").forEach(e => {
        e = parseInt(e);
        if (isNaN(e))
          throw new Error(`Invalid data in line ${index + 1}`);
        card.pickedNumbers.push(e);
      });

      return card;
    });
    
    consoleLine.innerHTML += " done.";
    return cards;
  }

  /**
   * Calculates the total number of points won (part 1) or the total number of cards copies (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Total number of points won (part 1) or the total number of cards copies (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let cards = this.parse(input);

      let visConsole = new Console();

      if (visualization)
        this.visContainer.append(visConsole.container);

      let totalPointsWon = 0;
      let totalNumberOfCardCopies = cards.length;
      let cardCopies = new Array(cards.length).fill(1);

      for (let [cardIndex, card] of cards.entries()) {
        if (this.isStopping)
          return;

        if (visualization)
          visConsole.addLine(`Card ${cardIndex + 1}:\n${card.winningNumbers.join(" ")}\n--------------------------------\n`);

        // Calculate winning numbers and points won with the card
        let numberOfWinningNumbers = 0;
        let pointsWon = 0;
        for (let pickedNumber of card.pickedNumbers) {
          if (card.winningNumbers.indexOf(pickedNumber) >= 0) {
            numberOfWinningNumbers++;
            pointsWon = pointsWon == 0 ? 1 : pointsWon * 2;
            if (visualization)
              visConsole.lines[visConsole.lines.length - 1].innerHTML += `<span class="highlighted">${pickedNumber}</span> `;
          }
          else {
            if (visualization)
              visConsole.lines[visConsole.lines.length - 1].innerHTML += `${pickedNumber} `;
          }
        }
        if (visualization) {
          visConsole.addLine(`Number of winning numbers: ${numberOfWinningNumbers}.`)
          if (part == 1)
            visConsole.addLine(`Points: ${pointsWon}.`)
        }
        totalPointsWon += pointsWon;

        // Add card copies
        if (part == 2) {
          for (let i = cardIndex + 1; i <= cardIndex + numberOfWinningNumbers && i < cards.length; i++) {
            cardCopies[i] += cardCopies[cardIndex];
            totalNumberOfCardCopies += cardCopies[cardIndex];
          }
        }

        if (visualization) {
          if (part == 2)
            visConsole.addLine(`Number of copies: ${cardCopies[cardIndex]}`);
          visConsole.addLine();
        }
      }

      return part == 1 ? totalPointsWon : totalNumberOfCardCopies;
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
 * Puzzle card class.
 */
class Card {
  /**
   * @param {number[]} winningNumbers Winning numbers.
   * @param {number[]} pickedNumbers Picked numbers.
   */
  constructor(winningNumbers = [], pickedNumbers = []) {
    /**
     * Winning numbers.
     * @type {number[]}
     */
    this.winningNumbers = winningNumbers;
    /**
     * Picked numbers.
     * @type {number[]}
     */
    this.pickedNumbers = pickedNumbers;
  }
}