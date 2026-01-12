import { delay, Console, PixelMap, leastCommonMultiple } from "../../utility.mjs";

const packetColorIndex = 1;
const packetColor = "#ffffff";
const scannerColorIndex = 2;
const scannerColor = "#999999";
const caughtColorIndex = 3;
const caughtColor = "#ff0000";

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
   * @returns {number[]} Scanner ranges.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let scannerRanges = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match = line.match(/^(\d+): (\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      let layerIndex = parseInt(match[1]);
      let range = parseInt(match[2]);
      for (let i = scannerRanges.length; i <= layerIndex; i++)
        scannerRanges.push(0);
      scannerRanges[layerIndex] = range;
    });

    consoleLine.innerHTML += " done.";
    return scannerRanges;
  }


  /**
   * Finds the severity of trip through the firewall.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Severity of trip through the firewall.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let scannerRanges = this.parse(input);

      let solConsoleLine;
      let pixelMap = new PixelMap(scannerRanges.length, Math.max(...scannerRanges, 1));
      if (visualization) {
        solConsoleLine = this.solConsole.addLine();

        this.visContainer.append(pixelMap.container);
        pixelMap.palette[packetColorIndex] = packetColor;
        pixelMap.palette[scannerColorIndex] = scannerColor;
        pixelMap.palette[caughtColorIndex] = caughtColor;
      }

      let maxPacketDelay = scannerRanges.reduce((acc, e) => leastCommonMultiple(acc, Math.max(1, (e - 1) * 2)), 1);

      for (let packetDelay = 0; packetDelay < maxPacketDelay; packetDelay++) {
        let caught = false;
        let severity = 0;
        for (let i = 0; i < scannerRanges.length; i++) {
          if (scannerRanges[i] > 0 && (scannerRanges[i] == 1 || (packetDelay + i) % ((scannerRanges[i] - 1) * 2) == 0)) {
            caught = true;
            severity += i * scannerRanges[i];
          }
        }

        if (part == 1 || (part == 2 && !caught)) {
          if (visualization) {
            if (part == 2)
              solConsoleLine.innerHTML = `Delay: ${packetDelay}.`;

            severity = 0;
            for (let i = 0; i < scannerRanges.length; i++) {
              if (this.isStopping)
                  return;

              for (let x = 0; x < pixelMap.width; x++) {
                let scannerY = -1;
                if (scannerRanges[x] == 1)
                  scannerY = 0;
                else if (scannerRanges[x] > 1) {
                  scannerY = (packetDelay + i) % ((scannerRanges[x] - 1) * 2);
                  if (scannerY >= scannerRanges[x])
                    scannerY = (scannerRanges[x] - 2) - (scannerY - scannerRanges[x]);
                }

                for (let y = 0; y < pixelMap.height; y++) {
                  pixelMap.drawPixel(x, y, scannerY == y ? scannerColorIndex : 0);
                }
              }

              pixelMap.drawPixel(i, 0, pixelMap.image[0][i] == 0 ? packetColorIndex : caughtColorIndex);
              if (pixelMap.image[0][i] == caughtColorIndex)
                severity += i * scannerRanges[i];
              if (part == 1)
                solConsoleLine.innerHTML = `Severity: ${severity}.`;

              await delay(100);
            }
          }

          return part == 1 ? severity : packetDelay;
        }          
      }

      throw new Error("Solution not found");
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