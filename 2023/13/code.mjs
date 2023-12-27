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
   * @returns {string[]} Patterns.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let patterns = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      if (index == 0 || line == "")
        patterns.push([]);

      if (line != "") {
        if (!/^[\.#]+$/.test(line))
          throw new Error(`Invalid data in line ${index + 1}`);
      
        let pattern = patterns[patterns.length - 1];
        if (pattern.length && line.length != pattern[0].length)
          throw new Error(`Invalid length of line ${index + 1}`);
        
        pattern.push(line);
      }
    });

    consoleLine.innerHTML += " done.";
    return patterns;
  }

  /**
   * Finds reflections in patterns.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of number of columns left of vertical reflections added to 100 multiplied by number of lines above the horizontal reflections.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let patterns = this.parse(input);
      
      let solConsole = this.solConsole;
      solConsole.addLine(`Number of patterns: ${patterns.length}.`)
      let solConsoleLine = solConsole.addLine();
      let visConsole = new Console();

      if (visualization)
        this.visContainer.append(visConsole.container);

      let answer = 0;

      for (let [patternIndex, pattern] of patterns.entries()) {
        if (this.isStopping)
          return;
        
        let reflectionType = "";
        // Find horizontal reflection
        let reflectionRowOrColumn = this.findReflection(pattern, part == 1 ? 0 : 1);
        if (reflectionRowOrColumn >= 0) {
          reflectionType = "horizontal";
          answer += (reflectionRowOrColumn + 1) * 100;
        }
        else {
          // Find vertical reflection
          let transposedPattern = pattern[0].split("").map((e, i) => pattern.map((line, j) => line.substring(i, i+ 1)).join(""));
          reflectionRowOrColumn = this.findReflection(transposedPattern, part == 1 ? 0 : 1);
          pattern = transposedPattern[0].split("").map((e, i) => transposedPattern.map((line, j) => line.substring(i, i+ 1)).join(""));
          if (reflectionRowOrColumn >= 0) {
            reflectionType = "vertical";
            answer += reflectionRowOrColumn + 1;
          }
          else
            throw new Error(`No reflection found for pattern ${patternIndex + 1}`);
        }

        solConsoleLine.innerHTML = `Pattern ${patternIndex + 1} has reflection across a ${reflectionType} line between ${reflectionType == "vertical" ? "columns" : "rows"} ${reflectionRowOrColumn + 1} and ${reflectionRowOrColumn + 2}.`;

        if (visualization) {
          visConsole.addLine(`Pattern ${patternIndex + 1}:`);

          if (reflectionType == "horizontal") {
            for (let i = 0; i < pattern.length; i++)
              pattern[i] = pattern[i].replace("A", `<span class="strongly-highlighted">#</span>`).replace("B", `<span class="strongly-highlighted">.</span>`);
            for (let i = 0; i < pattern.length; i++) {
              visConsole.addLine(pattern[i]);
              if (i <= reflectionRowOrColumn && reflectionRowOrColumn + (reflectionRowOrColumn - i) + 1 < pattern.length)
                visConsole.lines[visConsole.lines.length - 1].classList.add("weakly-highlighted");
              else if (i > reflectionRowOrColumn && reflectionRowOrColumn - (i - reflectionRowOrColumn) + 1 >= 0)
                visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
            }
          }
          else {
            for (let i = 0; i < pattern.length; i++) {
              let line = "";
              for (let j = 0; j < pattern[i].length; j++) {
                if (j <= reflectionRowOrColumn && reflectionRowOrColumn + (reflectionRowOrColumn - j) + 1 < pattern[0].length)
                  line += `<span class="weakly-highlighted">${pattern[i].substring(j, j + 1)}</span>`;
                else if (j > reflectionRowOrColumn && reflectionRowOrColumn - (j - reflectionRowOrColumn) + 1 >= 0)
                  line += `<span class="highlighted">${pattern[i].substring(j, j + 1)}</span>`;
                else
                  line += pattern[i].substring(j, j + 1);
              }
              line = line.replace("A", `<span class="strongly-highlighted">#</span>`);
              visConsole.addLine(line);
            }
          }
          visConsole.addLine();
          visConsole.container.scrollTop = visConsole.container.scrollHeight;

          await delay(10);
        }
      }

      return answer;
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

  /**
   * Finds reflection in the pattern and in case of smudges places A where # should be to make the reflection valid.
   * @param {string[]} pattern Pattern.
   * @param {number} numberSmudges Required number of smudges in the pattern.
   * @returns {number} Index of the last pattern line before the reflection (-1 if the reflection is not found).
   */
  findReflection(pattern, numberSmudges) {
    let originalPattern = pattern;

    for (let i = 0; i < pattern.length - 1; i++) {
      pattern = originalPattern.slice();
      let currentNumberOfSmudges = 0;
      for (let j = 0; i - j >= 0 && i + j + 1 < pattern.length && currentNumberOfSmudges <= numberSmudges; j++) {
        if (pattern[i - j] != pattern[i + j + 1]) {
          for (let k = 0; k < pattern[0].length && currentNumberOfSmudges <= numberSmudges; k++) {
            if (pattern[i - j].substring(k, k + 1) != pattern[i + j + 1].substring(k, k + 1)) {
              currentNumberOfSmudges++;
              if (pattern[i - j].substring(k, k + 1) == ".")
                pattern[i - j] = pattern[i - j].substring(0, k) + "A" + pattern[i - j].substring(k + 1);
              else
                pattern[i + j + 1] = pattern[i + j + 1].substring(0, k) + "A" + pattern[i + j + 1].substring(k + 1);
            }
          }
        }
      }
      if (currentNumberOfSmudges == numberSmudges) {
        for (let i = 0; i < pattern.length; i++)
          originalPattern[i] = pattern[i];
        return i;
      }
    }
    return -1;
  }
}
