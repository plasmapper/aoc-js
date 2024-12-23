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
   * @returns {number[]} Instructions (0 - noop, any other number - addx).
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let instructions = [];

    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match = line.match(/^(noop|addx)( -?\d+)?$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      if (match[1] == "noop")
        instructions.push(0);
      else
        instructions.push(parseInt(match[2].trim()));
    });

    consoleLine.innerHTML += " done.";
    return instructions;
  }

  /**
   * Calculates the sum of signal strengths or generates the CRT image.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number|string} The sum of signal strengths or the string "see image".
   */
  async solve(part, input, visualization) {
    const crtWidth = 40;
    const crtHeight = 6;

    try {
      this.isSolving = true;

      let instructions = this.parse(input);

      let solConsole = this.solConsole;
      let solConsoleLine;
      if (part == 2) {
        solConsole.addLine(`Number of cycles: ${instructions.reduce((acc, e) => acc + (e ? 2 : 1), 0)}.`);
        solConsoleLine = solConsole.addLine();
      }
      let visConsole = new Console();

      let registerValue = 1;
      let addxValue = 0;
      let signalStrengthSum = 0;
      let image = [];
      for (let i = 0; i < crtHeight; i++)
        image.push(new Array(crtWidth).fill(" "));

      if (visualization) {
        this.visContainer.append(visConsole.container);

        if (part == 2) {
          visConsole.container.style.width = `${crtWidth * 0.6}em`;
          visConsole.container.style.height = `${crtHeight * 1.25}em`;
  
          for (let i = 0; i < crtHeight; i++)
            visConsole.addLine();
        }
      }

      for (let cycle = 1, instructionIndex = 0; instructionIndex < instructions.length; cycle++) {
        if (this.isStopping)
          return;

        // Calculate the sum of signal strengths
        if (part == 1) {
          if ((cycle + 20) % 40 == 0)
          signalStrengthSum += cycle * registerValue;

          if (visualization) {
            visConsole.addLine(`Cycle ${cycle}: X = ${registerValue}.`);
            if ((cycle + 20) % 40 == 0)
              visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          }
        }
        // Draw CRT image
        else {
          let lineIndex = Math.floor((cycle - 1) / crtWidth);
          let pixelIndex = (cycle - 1) % crtWidth;
          
          if (Math.abs(registerValue - pixelIndex) <= 1)
            image[lineIndex][pixelIndex] = "#";
          else
            image[lineIndex][pixelIndex] = ".";

          solConsoleLine.innerHTML = `Cycle ${cycle}: X = ${registerValue}.\nCRT coordinates: x = ${pixelIndex}, y = ${lineIndex}.`;

          if (visualization) {
            for (let y = 0; y < crtHeight; y++) {
              let visualizationLine = "";
              for (let x = 0; x < crtWidth; x++) {
                let symbol = (y == lineIndex && Math.abs(registerValue - x) <= 1) ? "#" : image[y][x];
                if (y == lineIndex && x == pixelIndex)
                  symbol = `<span class="highlighted">${symbol}</span>`
                visualizationLine += symbol;
              }

              visConsole.lines[y].innerHTML = visualizationLine;
            }

            await delay(20);
          }
        }

        if (addxValue != 0) {
          registerValue += addxValue;
          addxValue = 0;
        }
        else
          addxValue = instructions[instructionIndex];
  
        if (addxValue == 0)
          instructionIndex++;
      }

      if (part == 2 && visualization) {
        for (let y = 0; y < crtHeight; y++)
          visConsole.lines[y].innerHTML = image[y].join("");
      }

      return part == 1 ? signalStrengthSum : `\n${image.map(e => e.join("")).join("\n")}\n`;
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