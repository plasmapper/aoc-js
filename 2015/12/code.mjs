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
   * @returns {Object} JSON document.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let document = JSON.parse(input.trim());
    
    consoleLine.innerHTML += " done.";
    return document;
  }

  /**
   * Calculates the sum of numbers in the document.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of numbers in the document.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let document = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let sum = 0;
      let elements = [document];
      while (elements.length) {
        let element = elements.pop();
        if (Array.isArray(element))
          element.forEach(e => elements.push(e));
        else {
          if (typeof element === "object" && (part == 1 || Object.values(element).indexOf("red") < 0))
            Object.keys(element).forEach(key => elements.push(element[key]));
          if (typeof element === "number")
            sum += element;
        }
      }

      if (visualization) {
        let visualizationLines = JSON.stringify(document, (key, value) => {
          if (typeof value === "number")
            return `|${value}|`;
          let redIndex;
          if (!Array.isArray(value) && typeof value === "object" && part == 2 && (redIndex = Object.values(value).indexOf("red")) >= 0) {
            value[Object.keys(value)[redIndex]] = null;
            return `#${JSON.stringify(value)}`;
          }
          return value;
        }, 1).split(/\r?\n/);
        
        for (let line of visualizationLines) {
          let hashIndex = line.indexOf("#");
          if (hashIndex < 0) {
            visConsole.addLine(line.replaceAll(`"|`, `<span class="strongly-highlighted">`).replaceAll(`|"`, `</span>`));
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          }
          else {
            let hasComma = line[line.length - 1] == ",";
            let isProperty = line[hashIndex - 3] == ":";
            let indentLevel = line.split("").findIndex(e => e != " ");
            if (isProperty)
              visConsole.addLine(line.substring(0, hashIndex - 2) + " {");

            JSON.stringify(JSON.parse(JSON.parse(`"${line.substring(hashIndex + 1, line.length - (hasComma ? 2 : 1))}"`)), null, 1)
              .split(/\r?\n/).slice(isProperty ? 1 : 0).forEach((subLine, i, subLines) => {
                visConsole.addLine((" ".repeat(indentLevel) + subLine + (i == subLines.length - 1 && hasComma ? "," : ""))
                  .replaceAll("null", `<span class="error">"red"</span>`));
            });
          }
        }
      }
      
      return sum;
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