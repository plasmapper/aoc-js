import { delay, Console, PixelMap } from "../../utility.mjs";

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
   * @returns {{
   *   files: File[]
   *   freeSpaces: MemorySegment[]
   * }} Memory.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let files = [];
    let freeSpaces = [];
    let position = 0;
    let segmentIsFile = true;
    let fileId = 0;

    input.trim().split("").forEach((symbol, symbolIndex) => {
      if (isNaN(symbol))
        throw new Error(`Invalid symbol ${symbolIndex + 1}`);

      let size = parseInt(symbol);
      if (segmentIsFile) {
        files.push(new File(fileId, [new MemorySegment(position, size)]));
        fileId++;
      }
      else
        freeSpaces.push(new MemorySegment(position, size));

      position += size;

      segmentIsFile = !segmentIsFile;
    });

    consoleLine.innerHTML += " done.";
    return { files, freeSpaces };
  }

  /**
   * Finds the filesystem checksum.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Filesystem checksum.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let { files, freeSpaces } = this.parse(input);
      let numberOfBlocks = files.reduce((acc, e) => acc += e.size, 0) + freeSpaces.reduce((acc, e) => acc += e.size, 0);

      let mapWidth = Math.ceil(Math.sqrt(numberOfBlocks));
      let mapHeight = mapWidth;

      let pixelMap = new PixelMap(mapWidth, mapHeight);

      if (visualization) {
        this.visContainer.append(pixelMap.container);
        for (let i = 1; i <= 10; i++)
          pixelMap.palette[i] = `rgb(0, ${i * 25}, 0)`;

        for (let file of files) {
          for (let memorySegment of file.memorySegments) {
            for (let i = 0; i < memorySegment.size; i++)
              pixelMap.drawPixel((memorySegment.position + i) % mapWidth, Math.floor((memorySegment.position + i) / mapWidth), file.id % 10 + 1);
          }
        }
      }

      for (let fileIndex = files.length - 1; fileIndex >= 0 && freeSpaces.length > 0 && freeSpaces[0].position < files[fileIndex].memorySegments[0].position; fileIndex--) {
        if (this.isStopping)
          return;

        let file = files[fileIndex];
        let oldMemorySegments = file.memorySegments.map(memorySegment => new MemorySegment(memorySegment.position, memorySegment.size));
        let newMemorySegments = [];

        for (let memorySegment of file.memorySegments) {
          // Move the segment block by block (part 1)
          if (part == 1) {
            while (memorySegment.size > 0 && freeSpaces.length > 0 && freeSpaces[0].position < memorySegment.position) {
              // Calculate movable size
              let size = Math.min(memorySegment.size, freeSpaces[0].size);
              // Move memory segment
              newMemorySegments.push(new MemorySegment(freeSpaces[0].position, size));
              memorySegment.size -= size;
              freeSpaces[0].size -= size;
              // Reduce free space size or remove it entirely
              if (freeSpaces[0].size > 0)
                freeSpaces[0].position += size;
              else
                freeSpaces.splice(0, 1);
            }
          }
          // Move the entire segment (part 2)
          else {
            // Find suitable free space
            let freeSpace = freeSpaces.find(freeSpace => freeSpace.position < memorySegment.position && freeSpace.size >= memorySegment.size);
            // Move memory segment
            if (freeSpace != undefined) {
              newMemorySegments.push(new MemorySegment(freeSpace.position, memorySegment.size));
              freeSpace.size -= memorySegment.size;
              freeSpace.position += memorySegment.size;
              memorySegment.size = 0;
            }
          }
        }

        // Append the memory segments that have not been moved
        file.memorySegments = newMemorySegments.concat(...file.memorySegments.filter(memorySegment => memorySegment.size > 0));

        if (visualization) {
          for (let memorySegment of oldMemorySegments) {
            for (let i = 0; i < memorySegment.size; i++)
              pixelMap.drawPixel((memorySegment.position + i) % mapWidth, Math.floor((memorySegment.position + i) / mapWidth), 0);
          }
          for (let memorySegment of file.memorySegments) {
            for (let i = 0; i < memorySegment.size; i++)
              pixelMap.drawPixel((memorySegment.position + i) % mapWidth, Math.floor((memorySegment.position + i) / mapWidth), file.id % 10 + 1);
          }
          await delay(1);
        }
      }

      // Memory segment checksum = file ID * (block position sum which is the sum of the arithmetic progression)
      return files.reduce((acc, file) => acc + file.memorySegments.reduce((fileAcc, memorySegment) =>
        fileAcc + file.id * memorySegment.size * (memorySegment.position * 2 + memorySegment.size - 1) / 2, 0), 0);
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
 * Puzzle memory segment class.
 */
class MemorySegment {
  /**
   * @param {number} position Memory segment position.
   * @param {number} size Memory segment size.
   */
  constructor(position, size) {
    /**
     * Memory segment position.
     * @type {number}
     */
    this.position = position;
    /**
     * Memory segment size.
     * @type {number}
     */
    this.size = size;
  }
}

/**
 * Puzzle file class.
 */
class File {
  /**
   * @param {number} id File ID.
   * @param {MemorySegment[]} memorySegments File memory segments.
   */
  constructor(id, memorySegments) {
    /**
     * File id.
     * @type {number}
     */
    this.id = id;
    /**
     * File memory segments.
     * @type {MemorySegment[]}
     */
    this.memorySegments = memorySegments;
    /**
     * File size.
     * @type {number}
     */
    this.size = memorySegments.reduce((acc, e) => acc + e.size, 0);
  }
}
