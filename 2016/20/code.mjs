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
    * @returns {Range[]} Blocked IP address ranges.
    */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");
    
    let blokedIpAddressRanges = input.trim().split(/\r?\n/).map((line, index) => {
      let match = line.match(/^(\d+)-(\d+)$/);
      if (match == null || parseInt(match[1]) > parseInt(match[2]))
        throw new Error(`Invalid data in line ${index + 1}`);
      return new Range(parseInt(match[1]), parseInt(match[2]));
    });

    consoleLine.innerHTML += " done.";
    return blokedIpAddressRanges;
  }

  /**
   * Finds the lowest-valued IP that is not blocked.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Lowest-valued IP that is not blocked.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let blokedIpAddressRanges = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Combine blocked IP address ranges
      blokedIpAddressRanges = Range.combine(blokedIpAddressRanges);

      if (part == 1) {
        // Find the index of the first blocked IP address range before gap
        let ipAddressRangeIndex = 0;
        while (ipAddressRangeIndex < blokedIpAddressRanges.length - 1 && blokedIpAddressRanges[ipAddressRangeIndex + 1].from == blokedIpAddressRanges[ipAddressRangeIndex].to + 1)
          ipAddressRangeIndex++;

        if (visualization) {
          visConsole.addLine(`Blocked IP address ranges:`);
          for (let i = 0; i <= ipAddressRangeIndex; i++)
            visConsole.addLine(`${blokedIpAddressRanges[i].from}-${blokedIpAddressRanges[i].to}`);
          visConsole.addLine();
          visConsole.addLine(`Lowest-valued IP address that is not blocked: <span class="highlighted">${blokedIpAddressRanges[ipAddressRangeIndex].to + 1}</span>.`);
          visConsole.addLine();
          visConsole.addLine(`Blocked IP address ranges:`);
          for (let i = ipAddressRangeIndex + 1; i < blokedIpAddressRanges.length; i++)
            visConsole.addLine(`${blokedIpAddressRanges[i].from}-${blokedIpAddressRanges[i].to}`);
          visConsole.container.scrollTop = visConsole.lines[ipAddressRangeIndex + 4].offsetTop - visConsole.container.offsetHeight / 2;
        }
      
        return blokedIpAddressRanges[ipAddressRangeIndex].to + 1;
      }
      else {
        let numberOfBlockedIpAddresses = blokedIpAddressRanges.reduce((acc, e) => acc + e.to - e.from + 1, 0);
        if (visualization) {
          visConsole.addLine(`Blocked IP address ranges:`);
          visConsole.addLine(`(${numberOfBlockedIpAddresses} addresses are blocked,`);
          visConsole.addLine(`<span class="highlighted">${4294967296 - numberOfBlockedIpAddresses}</span> addresses are not blocked):`);
          for (let range of blokedIpAddressRanges)
            visConsole.addLine(`${range.from}-${range.to}`);
        }

        return 4294967296 - numberOfBlockedIpAddresses;
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