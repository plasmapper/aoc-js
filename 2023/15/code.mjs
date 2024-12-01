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
   * @returns {Step[]} Initialization sequence.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let steps = [];
    
    input.replaceAll(/\r?\n/g, "").split(",").forEach((line, index) => {
      let match = line.match(/^([a-z]+)=(\d)$/);
      if (match != null)
        steps.push(new Step(match[1], "=", parseInt(match[2])));
      else {
        match = line.match(/^([a-z]+)-$/)
        if (match != null)
          steps.push(new Step(match[1], "-"));
        else
          throw new Error(`Invalid data in step ${index + 1}`);
      }
    });

    consoleLine.innerHTML += " done.";
    return steps;
  }

  /**
   * Calculates the sum of initialization sequence hashes (part 1) or total lens focusing power (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of initialization sequence hashes (part 1) or total lens focusing power (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let steps = this.parse(input);

      let solConsole = this.solConsole;
      solConsole.addLine(`Number of steps: ${steps.length}.`);
      let solConsoleLine = solConsole.addLine();

      // Calculate the sum of initialization sequence hashes
      if (part == 1) {
        return steps.reduce((acc, step) => acc + this.hash(step.instructionAsString), 0)
      }
      // Calculate the total lens focusing power
      else {
        let visConsole = new Console();
        let visConsoleLine = visConsole.addLine();

        if (visualization)
          this.visContainer.append(visConsole.container);

        let boxes = new Array(256).fill().map(e => []);

        for (let [stepIndex, step] of steps.entries()) {
          if (this.isStopping)
            return;

          let boxIndex = this.hash(step.lensLabel);
          let box = boxes[boxIndex];
          if (step.action == "-")
            boxes[boxIndex] = box.filter(lens => lens.label != step.lensLabel);
          if (step.action == "=") {
            let lensInBox = box.find(lens => lens.label == step.lensLabel);
            if (lensInBox == undefined)
              box.push(new Lens(step.lensLabel, step.lensFocalLength))
            else
              lensInBox.focalLength = step.lensFocalLength;
          }

          solConsoleLine.innerHTML = `Step: ${stepIndex + 1}.`;

          if (visualization) {
            let line = "";
            for (let i = 0; i < boxes.length; i++) {
              if (boxes[i].length)
                line += `Box ${i}: ${boxes[i].map(lens => `[${lens.label} ${lens.focalLength}]`).join(" ")}\n`;
            }
            visConsoleLine.innerHTML = line;

            await delay(1);
          }
        }

        return boxes.reduce((acc, box, boxIndex) => acc + box.reduce((boxAcc, lens, lensIndex) => boxAcc + (boxIndex + 1) * (lensIndex + 1) * lens.focalLength, 0), 0);
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

  /**
   * Calculates the hash value of the string.
   * @param {string} string String.
   * @returns {number} Hash.
   */
  hash(string) {
    let hash = 0;
    for (let asciiValue of string.split("").map(e => e.charCodeAt(0))) {
      hash += asciiValue;
      hash *= 17;
      hash %= 256;
    }
    return hash;
  }
}

/**
 * Puzzle initialization step class.
 */
class Step {
  /**
   * @param {string} lensLabel Lens label.
   * @param {string} action Action ('=': add the lens, '-': remove the lens).
   * @param {number} lensFocalLength Lens focal length.
   */
  constructor(lensLabel, action, lensFocalLength = 0) {
    /**
     * Step instruction as a string.
     * @type {string}
     */
    this.instructionAsString = lensLabel + action + (action == "=" ? lensFocalLength : "");
    /**
     * Lens label.
     * @type {string}
     */
    this.lensLabel = lensLabel;
    /**
     * Action ('=': add the lens, '-': remove the lens).
     * @type {string}
     */
    this.action = action;
    /**
     * Lens focal length.
     * @type {number}
     */
    this.lensFocalLength = lensFocalLength;
  }
}

/**
 * Puzzle lens class.
 */
class Lens {
  /**
   * @param {string} label Lens label.
   * @param {number} focalLength Lens focal length.
   */
  constructor(label, focalLength) {
    /**
     * Lens label.
     * @type {string}
     */
    this.label = label;
    /**
     * Lens focal length.
     * @type {number}
     */
    this.focalLength = focalLength;    
  }
}