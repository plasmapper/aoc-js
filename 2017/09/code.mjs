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
   * @returns {object} Stream.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let parseElement = (data, index) => {
      let element;
      if (data[index] == "{") {
        element = [];
        index++;
        while (index < data.length && data[index] != "}") {
          if (data[index] == "," && element.length > 0)
            index++;
          else {
            let [newIndex, newElement] = parseElement(data, index);
            index = newIndex;
            element.push(newElement);
          }
        }
        if (index >= data.length)
          throw new Error("Invalid input data");
      }
      else if (data[index] == "<") {
        element = "";
        index++;
        while (index < data.length && data[index] != ">") {
          if (data[index] == "!" && index + 1 < data.length) {
            element += data[index] + data[index + 1];
            index += 2;
          }
          else {
            element += data[index];
            index++;
          }
        }
        if (index >= data.length)
          throw new Error("Invalid input data");
      }
      else
        throw new Error("Invalid input data");
      return [index + 1, element];
    };

    let stream = parseElement(input.trim().split(""), 0)[1];
    if (!Array.isArray(stream))
      throw new Error("Invalid input data");

    consoleLine.innerHTML += " done.";
    return stream;
  }

  /**
   * Finds the total score for all groups (part 1) or the number of non-canceled characters are within the garbage (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Total score for all groups (part 1) or the number of non-canceled characters are within the garbage (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let stream = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let totalGroupScore = 0;
      let totalNumberOfNonCanceledCharactersInGarbage = 0;

      let drawTree = (element, prefix) => {
        if (Array.isArray(element)) {
          totalGroupScore += prefix.length + 1;
          let scoreString = part == 1 ? ` (score: <span class="highlighted">${prefix.length + 1}</span>)` : "";
          if (element.length == 0) {
            if (visualization)
              visConsole.addLine(`${prefix}{}${scoreString}`);
          }
          else {
            if (visualization)
              visConsole.addLine(`${prefix}{`);
            for (let i = 0; i < element.length; i++) {
              drawTree(element[i], prefix + " ")
              if (i < element.length - 1) {
                if (visualization)
                  visConsole.lines[visConsole.lines.length - 1].innerHTML += ",";
              }
            }
            if (visualization)
              visConsole.addLine(`${prefix}}${scoreString}`);
          }
        }
        else {
          element = element.split("");
          let cancel = 0;
          let numberOfNonCanceledCharacters = 0;
          let garbageString = element.map((e, i) => {
            cancel = cancel > 0 ? cancel - 1 : 0;
            if (cancel == 0 && e == "!")
              cancel = 2;
            numberOfNonCanceledCharacters += cancel ? 0 : 1;
            if (part == 1)
              return e == "<" ? "&lt;" : (e == ">" ? "&gt;" : e);
            else 
              return `<span${cancel ? " class='error'" : ""}>${e == "<" ? "&lt;" : (e == ">" ? "&gt;" : e)}</span>`;
          }).join("");

          totalNumberOfNonCanceledCharactersInGarbage += numberOfNonCanceledCharacters;

          if (visualization)
            visConsole.addLine(`${prefix}&lt;${garbageString}&gt;${part == 2 ? ` (<span class="highlighted">${numberOfNonCanceledCharacters}</span> character${numberOfNonCanceledCharacters == 1 ? "" : "s"})` : ""}`);
        }
      }

      drawTree(stream, "");

      return part == 1 ? totalGroupScore : totalNumberOfNonCanceledCharactersInGarbage;
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