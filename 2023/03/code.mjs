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
   * @returns {string[]} Schematic lines.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let lines = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      lines.push(line.trim());
      if (index != 0 && line.length != lines[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);
    });
    
    consoleLine.innerHTML += " done.";
    return lines;
  }

  /**
   * Calculates the sum of part numbers in the engine schematic (part 1) or the sum of gear ratios (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The sum of part numbers in the engine schematic (part 1) or the sum of gear ratios (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let lines = this.parse(input);

      let solConsole = this.solConsole;
      let visConsole = new Console();

      solConsole.addLine(`Number of lines: ${lines.length}.`);
      let solConsoleLine = solConsole.addLine();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let numberRegExp = /\d+/g;
      let symbolRegExp = /[^0-9\.]+/;
      let gearRegExp = /\*/g;

      // Find number strings adjacent to symbols
      let numberStrings = [];
      for (let [lineIndex, line] of lines.entries()) {
        numberStrings.push([]);
        let match;
        while ((match = numberRegExp.exec(line)) != null) {
          let numberString = new NumberString(match[0], match.index, match.index + match[0].length);
          let isAdjacentToSymbol = false;
          if (symbolRegExp.test(line.substring(Math.max(0, numberString.startIndex - 1), Math.min(line.length, numberString.endIndex + 1))))
            isAdjacentToSymbol = true;
          if (lineIndex > 0 && symbolRegExp.test(lines[lineIndex - 1].substring(Math.max(0, numberString.startIndex - 1), Math.min(line.length, numberString.endIndex + 1))))
            isAdjacentToSymbol = true;
          if (lineIndex < lines.length - 1 && symbolRegExp.test(lines[lineIndex + 1].substring(Math.max(0, numberString.startIndex - 1), Math.min(line.length, numberString.endIndex + 1))))
            isAdjacentToSymbol = true;
          
          if (isAdjacentToSymbol)
            numberStrings[lineIndex].push(numberString);
        }
      }

      // Find gears adjacent to two numbers
      let gears = [];
      for (let [lineIndex, line] of lines.entries()) {
        gears.push([]);
        let match;
        while ((match = gearRegExp.exec(line)) != null) {
          let gearSymbolIndex = match.index;
          let gearNumberStrings = [];
          for (let numberString of numberStrings[lineIndex]) {
            if (gearSymbolIndex >= numberString.startIndex - 1 && gearSymbolIndex <= numberString.endIndex)
              gearNumberStrings.push(numberString);
          }
          if (lineIndex > 0) {
            for (let numberString of numberStrings[lineIndex - 1]) {
              if (gearSymbolIndex >= numberString.startIndex - 1 && gearSymbolIndex <= numberString.endIndex)
                gearNumberStrings.push(numberString);
            }
          }
          if (lineIndex < lines.length - 1) {
            for (let numberString of numberStrings[lineIndex + 1]) {
              if (gearSymbolIndex >= numberString.startIndex - 1 && gearSymbolIndex <= numberString.endIndex)
                gearNumberStrings.push(numberString);
            }
          }
  
          if (gearNumberStrings.length == 2) {
            gears[gears.length - 1].push(new Gear(gearSymbolIndex, gearNumberStrings[0], gearNumberStrings[1]));
            gearNumberStrings[0].isPartOfGearRatio = gearNumberStrings[1].isPartOfGearRatio = true;
          }
        }
      }

      // Calculate the answers and visualize
      let partNumberSum = 0;
      let gearRatioSum = 0;
      for (let [lineIndex, line] of lines.entries()) {
        if (this.isStopping)
          return;

        if (part == 1) {
          partNumberSum += numberStrings[lineIndex].reduce((acc, e) => acc + parseInt(e.value), 0)
          solConsoleLine.innerHTML = `Line ${lineIndex + 1}: total number sum is ${partNumberSum}.`;
        }
        else {
          gearRatioSum += gears[lineIndex].reduce((acc, e) => acc + parseInt(e.numberString1.value) * parseInt(e.numberString2.value), 0);
          solConsoleLine.innerHTML = `Line ${lineIndex + 1}: total gear ratio is ${gearRatioSum}.`;
        }

        if (visualization) {
          let visConsoleLine = visConsole.addLine();
          let highlightedRanges = numberStrings[lineIndex].filter(e => part == 1 || e.isPartOfGearRatio).map(e => new Range(e.startIndex, e.endIndex));;
          if (part == 2)
            highlightedRanges = highlightedRanges.concat(gears[lineIndex].map(e => new Range(e.symbolIndex, e.symbolIndex + 1)));
          highlightedRanges.sort((r1, r2) => r1.from - r2.from);

          if (highlightedRanges.length == 0)
            visConsoleLine.innerHTML = line;
          else {
            visConsoleLine.innerHTML += line.substring(0, highlightedRanges[0].from);
            for (let i = 0; i < highlightedRanges.length; i++) {
              visConsoleLine.innerHTML += `<span class="highlighted">${line.substring(highlightedRanges[i].from, highlightedRanges[i].to)}</span>`;
              visConsoleLine.innerHTML += line.substring(highlightedRanges[i].to, i < highlightedRanges.length - 1 ? highlightedRanges[i + 1].from : line.length);
            }
            visConsole.container.scrollTop = visConsole.lines[visConsole.lines.length - 1].offsetTop - visConsole.container.offsetHeight / 2;
          }
          
          await delay(10);
        }
      }

      return part == 1 ? partNumberSum : gearRatioSum;
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
 * Puzzle number string class.
 */
class NumberString {
  /**
   * @param {string} value Number string.
   * @param {number} startIndex Start index.
   * @param {number} endIndex endIndex End index (index of the first character after the number string).
   */
  constructor(value, startIndex, endIndex) {
    /**
     * Number string.
     * @type {string}
     */
    this.value = value;
    /**
     * Start index.
     * @type {number}
     */
    this.startIndex = startIndex;
    /**
     * End index (index of the first character after the number string).
     * @type {number}
     */
    this.endIndex = endIndex;
    /**
     * Is true if number string is a part of a gear ratio.
     * @type {boolean}
     */
    this.isPartOfGearRatio = false;
  }
}

/**
 * Puzzle gear class
 */
class Gear {
  /**
   * @param {number} symbolIndex Gear symbol index. 
   * @param {NumberString} numberString1 Number string 1.
   * @param {NumberString} numberString2 Number string 2.
   */
  constructor(symbolIndex, numberString1, numberString2) {
    /**
     * End index (index of the first character after the number string).
     * @type {number}
     */
    this.symbolIndex = symbolIndex;
    /**
     * Number string 1.
     * @type {NumberString}
     */
    this.numberString1 = numberString1;
    /**
     * Number string 2.
     * @type {NumberString}
     */
    this.numberString2 = numberString2;
  }
}