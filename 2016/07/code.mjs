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
   * @returns {string[]} Addresses.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let addresses = input.trim().split(/\r?\n/);

    consoleLine.innerHTML += " done.";
    return addresses;
  }

  /**
   * Finds the number of IP addresses that support TLS (part 1) or SSL (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of IP addresses that support TLS (part 1) or SSL (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let addresses = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let sequenceSize = part == 1 ? 4 : 3;
      let numberOfValidAddresses = 0;


      for (let address of addresses) {
        let insideBrackets = 0;
        let outsideBracketsSequenceIndexes = [];
        let insideBracketsSequenceIndexes = [];
        for (let i = 0; i < address.length - (sequenceSize - 1); i++) {
          if (address[i] == "[")
            insideBrackets++;
          else if (address[i] == "]")
            insideBrackets = Math.max(0, insideBrackets - 1);
          else {
            let sequenceIsValid = new RegExp(`[a-z]{${sequenceSize}}`).test(address.substring(i, i + sequenceSize));

            if (part == 1)
              sequenceIsValid &&= address[i] == address[i + 3] && address[i + 1] != address[i] && address[i + 1] == address[i + 2];
            else
              sequenceIsValid &&= address[i] == address[i + 2] && address[i + 1] != address[i];

            if (sequenceIsValid) {
              if (insideBrackets)
                insideBracketsSequenceIndexes.push(i);
              else
                outsideBracketsSequenceIndexes.push(i);
            }
          }
        }

        let addressIsValid = false;
        if (part == 1) {
          addressIsValid = outsideBracketsSequenceIndexes.length > 0 && insideBracketsSequenceIndexes.length == 0;
          
          if (visualization) {
            if (addressIsValid) {
              let visConsoleString = "";
              for (let index of outsideBracketsSequenceIndexes)
                visConsoleString += `${address.substring(0, address.substring(0, index))}<span class="highlighted">${address.substring(index, index + sequenceSize)}</span>`;
              visConsoleString += address.substring(outsideBracketsSequenceIndexes[outsideBracketsSequenceIndexes.length - 1] + sequenceSize);
              visConsole.addLine(visConsoleString);
            }
            else
              visConsole.addLine(address);
            visConsole.addLine();
          }
        }
        else {
          let outsideBracketsSequenceIndex = null, insideBracketsSequenceIndex = null;
          for (let i = 0; i < outsideBracketsSequenceIndexes.length && !addressIsValid; i++) {
            let index1 = outsideBracketsSequenceIndexes[i];
            let sequence = address.substring(index1, index1 + sequenceSize);
            let index2 = insideBracketsSequenceIndexes.find(i => address.substring(i, i + sequenceSize) == `${sequence[1]}${sequence[0]}${sequence[1]}`);
            if (index2 != undefined) {
              addressIsValid = true;
              outsideBracketsSequenceIndex = index1;
              insideBracketsSequenceIndex = index2;
            }
          }

          if (visualization) {
            if (addressIsValid) {
              let visConsoleString = "";
              for (let i = 0; i < address.length; i++) {
                if (i >= outsideBracketsSequenceIndex && i < outsideBracketsSequenceIndex + sequenceSize)
                  visConsoleString += `<span class="highlighted">${address[i]}</span>`;
                else if (i >= insideBracketsSequenceIndex && i < insideBracketsSequenceIndex + sequenceSize)
                  visConsoleString += `<span class="strongly-highlighted">${address[i]}</span>`;
                else
                  visConsoleString += address[i];
              }
              visConsole.addLine(visConsoleString);
            }
            else
              visConsole.addLine(address);
          }
        }

        if (addressIsValid)
          numberOfValidAddresses++;
      }

      return numberOfValidAddresses;
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