import { delay, Console } from "../../utility.mjs";

let cardValues = {2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, T: 10, J: 11, Q: 12, K: 13, A: 14};

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
   * @returns {Hand[]} Hands.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let hands = input.trim().split(/\r?\n/).map((line, index) => {
      let match = line.match(/^([2-9TJQKA]{5}) (\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);

      return new Hand(match[1].split("").map(e => cardValues[e]), parseInt(match[2]));
    });

    consoleLine.innerHTML += " done.";
    return hands;
  }

  /**
   * Calculates the total winnings.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Total winnings.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let hands = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      if (part == 2) {
        cardValues.J = 1;
        hands.forEach(hand => hand.cards = hand.cards.map(card => card == 11 ? 1 : card));
      }

      for (let hand of hands) {
        let factor = 1;

        // Calculate the hand value (for part 2 - without jokers)
        for (let cardIndex = 0; cardIndex < hand.cards.length; cardIndex++, factor *= 16) {
          // 5th card + 4th card * 16 + 3rd card * 256 + 2nd card * 4096 + 1st card * 65536
          hand.value += hand.cards[hand.cards.length - cardIndex - 1] * factor;
          
          let newNumberOfCards = ++hand.numbersOfCards[hand.cards[cardIndex]];
          if (hand.cards[cardIndex] != 1) {
            // Type 0 can become 1, 1 - 2/3, 2 - 4, 3 - 4/5, 5 - 6
            switch (hand.typeWithoutJokers) {
              case 0:
                if (newNumberOfCards == 2)
                  hand.typeWithoutJokers = 1;
                break;
              case 1: 
                if (newNumberOfCards == 2)
                  hand.typeWithoutJokers = 2;
                if (newNumberOfCards == 3)
                  hand.typeWithoutJokers = 3;
                break;
              case 2: 
                if (newNumberOfCards == 3)
                  hand.typeWithoutJokers = 4;
                break;
              case 3: 
                if (newNumberOfCards == 2)
                  hand.typeWithoutJokers = 4;
                if (newNumberOfCards == 4)
                  hand.typeWithoutJokers = 5;
                break;
              case 5: 
                if (newNumberOfCards == 5)
                  hand.typeWithoutJokers = 6;
                break;
            }
          }
        }

        hand.type = hand.typeWithoutJokers;

        // Add jokers
        if (part == 2) {
          for (let i = 0; i < hand.numbersOfCards[1]; i++) {
            // Type 0 becomes 1, 1 - 3, 2 - 4, 3 - 5, 5 - 6
            switch (hand.type) {
              case 0:
                hand.type = 1;
                break;
              case 1: 
                hand.type = 3;
                break;
              case 2: 
                hand.type = 4;
                break;
              case 3: 
                hand.type = 5;
                break;
              case 5: 
                hand.type = 6;
                break;
            }
          }
        }

        // Type * 1048576
        hand.value += hand.type * factor;
      }

      hands.sort((h1, h2) => h1.value - h2.value);

      if (visualization) {
        for (let [handIndex, hand] of hands.entries()) {
          let line = `Rank ${handIndex + 1}: `;
          
          let highlightedCard = 0;

          if (hand.typeWithoutJokers == 0 && hand.numbersOfCards[1] > 0)
            highlightedCard = hand.cards.find(card => card != 1);

          for (let card of hand.cards) {
            let cardName = Object.keys(cardValues).find(key => cardValues[key] == card);
            let styleClass = "";
            if (card == 1 || card == highlightedCard)
              styleClass = "highlighted";
            else {
              if (hand.numbersOfCards[card] > 1) {
                if (highlightedCard == 0) {
                  styleClass = "highlighted";
                  highlightedCard = card;
                }
                else
                  styleClass = "strongly-highlighted";
              }
            }
            line += `<span${styleClass == "" ? "" : ` class="${styleClass}"`}>${cardName}</span>`
          }
          line += `, bid: ${hand.bid}.`
          visConsole.addLine(line);
        }
      }

      return hands.reduce((acc, e, index) => acc + (index + 1) * e.bid, 0);
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
 * Puzzle hand class.
 */
class Hand {
  /**
   * @param {number[]} cards Cards.
   * @param {number} bid Bid amount.
   */
  constructor(cards, bid) {
    /**
     * Cards.
     * @type {number[]}
     */
    this.cards = cards;
    /**
     * Bid amount.
     * @type {number}
     */
    this.bid = bid;
    /**
     * Array with each element being the number of cards in a hand with a value equal to the array index.
     * @type {number[]}
     */
    this.numbersOfCards = new Array(15).fill(0);
    /**
     * Hand type (high card: 0, one pair: 1, two pair: 2, three of a kind: 3, full house: 4, four of a kind: 5, five of a kind: 6).
     */
    this.type = 0;
    /**
     * Hand type without jokers.
     */
    this.typeWithoutJokers = 0;
    /**
     * Hand value (better cards lead to highe value).
     * @type {number}
     */
    this.value = 0;
  }
}