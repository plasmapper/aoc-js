import { delay, Console, PixelMap } from "../../utility.mjs";

const blockColorIndex = 1;
const blockColor = "#ffffff";

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
   * @returns {number[]} Memory banks.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    input = input.trim().replaceAll(/[\s\t]+/g, " ");
    if (!/^[\d\s]+$/.test(input))
      throw new Error(`Invalid data in line ${index + 1}`);

    let memoryBanks = input.split(" ").map(e => parseInt(e));

    consoleLine.innerHTML += " done.";
    return memoryBanks;
  }


  /**
   * Finds the number of redistribution cycles before a configuration is produced that has been seen before (part 1) or the size of the loop (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of redistribution cycles before a configuration is produced that has been seen before (part 1) or the size of the loop (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let memoryBanks = this.parse(input);

      let initialMemoryBanks = memoryBanks.slice();
      let stateMap = new Map();
      let maxNumberOfBlocksInMemoryBank = Math.max(...memoryBanks);

      for (let cycle = 0; ; cycle++) {
        let stateHash = memoryBanks.join("|");
        let previousSameStateCycle = stateMap.get(stateHash);
        
        if (previousSameStateCycle != undefined) {
          if (visualization) {
            let solConsole = this.solConsole;
            let solConsoleLine = solConsole.addLine();
            let pixelMap = new PixelMap(memoryBanks.length, maxNumberOfBlocksInMemoryBank);
            this.visContainer.append(pixelMap.container);
            pixelMap.palette[blockColorIndex] = blockColor;
            
            memoryBanks = initialMemoryBanks;
            for (let i = 1; i <= cycle; i++) {
              if (this.isStopping)
                return;

              this.reallocationCycle(memoryBanks);
              if (i % 100 == 0 || i == cycle) {
                for (let x = 0; x < pixelMap.width; x++) {
                  for (let y = 0; y < pixelMap.height; y++)
                    pixelMap.drawPixel(x, pixelMap.height - 1 - y, memoryBanks[x] > y ? blockColorIndex : 0);
                }

                solConsoleLine.innerHTML = `Cycle: ${i}.`;
                await delay(100);
              }
            }

            if (part == 1)
              solConsole.addLine(`Memory state after cycle <span class="highlighted">${cycle}</span> is the same as after cycle ${previousSameStateCycle}.`);
            else
              solConsole.addLine(`Memory state after cycle ${cycle} is the same as after cycle ${previousSameStateCycle} (loop size is <span class="highlighted">${cycle - previousSameStateCycle}</span>).`);
          }

          return part == 1 ? cycle : cycle - previousSameStateCycle;
        }

        stateMap.set(stateHash, cycle);
        this.reallocationCycle(memoryBanks);
        maxNumberOfBlocksInMemoryBank = Math.max(maxNumberOfBlocksInMemoryBank, ...memoryBanks);
      }
    }
    
    finally {
      this.isSolving = false;
    }
  }

  /**
   * Performs a reallocation cycle on memoty banks.
   * @param {number[]} memoryBanks Memoty banks
   */
  reallocationCycle(memoryBanks) {
    let maxNumberOfBlocksBankIndex = memoryBanks.reduce((acc, e, i) => e > memoryBanks[acc] ? i : acc, 0);
    let numberOfBlocks = memoryBanks[maxNumberOfBlocksBankIndex];
    memoryBanks[maxNumberOfBlocksBankIndex] = 0;
    for (let i = (maxNumberOfBlocksBankIndex + 1) % memoryBanks.length; numberOfBlocks > 0; i = (i + 1) % memoryBanks.length, numberOfBlocks--)
      memoryBanks[i]++;
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