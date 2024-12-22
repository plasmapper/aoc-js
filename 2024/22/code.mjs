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
   * @returns {number[]} Initial secret numbers.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let initialNumbers = [];
  
  input.trim().split(/\r?\n/).forEach((line, lineIndex) => {
    line = line.trim();
    if (!/^[0-9]+$/.test(line))
      throw new Error(`Invalid data in line ${lineIndex + 1}`);
    initialNumbers.push(parseInt(line));
  });

  consoleLine.innerHTML += " done.";
  return initialNumbers;
}

  /**
   * Calculates the sum of the secret numbers (part 1) or the maximal sum of prices after some price change sequence (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of the secret numbers (part 1) or the maximal sum of prices after some price change sequence (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let initialNumbers = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let finalNumbers = [];
      let priceMaps = [];
      let priceSumMap = new Map();

      for (let number of initialNumbers) {
        let numbers = [];
        let prices = [];
        let priceChanges = [undefined];
        let priceMap = new Map();

        for (let i = 0; i <= 2000; i++) {
          numbers.push(number);
          // Calculate price
          let price = number % 10;
          prices.push(price);
          // Calculate price change
          if (i > 0)
            priceChanges.push(prices[i] - prices[i - 1]);

          if (i >= 4) {
            // Create price change sequence key from the last 4 price changes
            let key = `${priceChanges[i - 3]}${priceChanges[i - 2]}${priceChanges[i - 1]}${priceChanges[i]}`;
            // If this sequence has not been encountered yet
            if (priceMap.get(key) == undefined) {
              // Add the price to the price map
              priceMap.set(key, price);
              // Add the price to the price sum map
              let priceSum = priceSumMap.get(key);
              if (priceSum == undefined)
                priceSumMap.set(key, price);
              else
                priceSumMap.set(key, priceSum + price);
            }
          }

          // Calculate next secret number
          number = (number ^ (number << 6)) & 16777215;
          number = (number ^ (number >> 5)) & 16777215;
          number = (number ^ (number * 2048)) & 16777215;
        }

        priceMaps.push(priceMap);
        finalNumbers.push(numbers[numbers.length - 1]);
      }

      // Calculates the sum of the secret numbers (part 1)
      if (part == 1) {
        if (visualization) {
          for (let i = 0; i < initialNumbers.length; i++) {
            visConsole.addLine(`Initial number: ${initialNumbers[i]}.\n2000th secret number: ${finalNumbers[i]}.`);
            visConsole.addLine();
          }
        }
        return finalNumbers.reduce((acc, e) => acc + e, 0);
      }

      // Calcuate the maximal sum of prices after some price change sequence (part 2)
      else {
        let maxPriceSum = 0;
        let maxPriceSumKey = "";
        for (let [key, sum] of priceSumMap) {
          if (sum > maxPriceSum) {
            maxPriceSum = sum;
            maxPriceSumKey = key;
          }
        }

        if (visualization) {
          let priceChangeSequence = [];
          for (let key = maxPriceSumKey; key.length > 0;) {
            if (key.substring(0, 1) == "-") {
              priceChangeSequence.push(key.substring(0, 2));
              key = key.substring(2);
            }
            else {
              priceChangeSequence.push(key.substring(0, 1));
              key = key.substring(1);
            }
          }
          visConsole.addLine(`Price change sequence: ${priceChangeSequence.join(", ")}`)
          visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          visConsole.addLine();

          for (let i = 0; i < initialNumbers.length; i++) {
            let price = priceMaps[i].get(maxPriceSumKey);
            visConsole.addLine(`Initial number: ${initialNumbers[i]}.\nPrice: ${price == undefined ? 0 : price}.`);
            visConsole.addLine();
          }
        }
  
        return maxPriceSum;
      }
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