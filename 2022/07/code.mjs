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
   * @returns {Directory} Root directory of the puzzle file system.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let root = new Directory("/", null);
    let currentDir = root;
    
    let lsCommandInProgress = false;
    let regExpResult;

    input.trim().split(/\r?\n/).forEach((line, index) => {
      // Parse ls command output
      if (lsCommandInProgress) {
        if ((regExpResult = /^dir (.+)$/.exec(line)) != null)
          currentDir.directories.push(new Directory(regExpResult[1], currentDir));
        else if ((regExpResult = /^(\d+) (.+)$/.exec(line)) != null)
          currentDir.files.push(new File(regExpResult[2], Number(regExpResult[1])));
        else
          lsCommandInProgress = false;
      }

      // Parse command
      if (!lsCommandInProgress) {
        let newDir;

        // Parse cd command
        if ((regExpResult = /^\$ cd (.+)$/.exec(line)) != null) {
          if (regExpResult[1] == "/")
            currentDir = root;
          else if (regExpResult[1] == ".." && currentDir.parent != null)
            currentDir = currentDir.parent;
          else if ((newDir = currentDir.directories.find(e => e.name == regExpResult[1])) != undefined)
            currentDir = newDir;
          else
            throw new Error(`Invalid command \"${line}\" in line ${index + 1}`);
        }
        // Parse ls command
        else if (/^\$ ls$/.test(line)) {
          lsCommandInProgress = true;
        }
        // Unknown command
        else
          throw new Error(`Invalid command \"${line}\" in line ${index + 1}`);
      }
    });

    consoleLine.innerHTML += " done.";
    return root;
  }

  /**
   * Finds all directories with a size of 100000 and less (part 1) or finds the smallest directory which size is greater than the size of the space that should be cleared (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Total found directory size.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;
      
      let root = this.parse(input);
      // Calculate the sizes of all directories
      root.calculateSize();
      
      // Create an array with all directories
      let allDirectories = [root];
      allDirectories = allDirectories.concat(root.getAllDirectories());
      // Sort directories by size in ascending order
      allDirectories.sort((d1, d2) => d1.size - d2.size);

      let answer;
      // Find all directories with a size of 100000 and less (part 1)
      if (part == 1) {
        let smallDirList = [];
        for (let directory of allDirectories) {
          if (directory.size <= 100000) {
            smallDirList.push(directory);
            directory.selected = true;
          }
        }

        this.solConsole.addLine(`Directories with a total size of at most 100000: ${smallDirList.map(e => `\"${e.name}\"`).join(", ")}.`);
        
        answer = smallDirList.reduce((acc, e) => acc + e.size, 0);
      }
      // Find the smallest directory which size is greater than the size of the space that should be cleared (part 2)
      else {
        let dirToDelete = allDirectories.find(e => e.size >= root.size - 40000000);
        dirToDelete.selected = true;

        this.solConsole.addLine(`Outermost directory size: ${root.size}.`);
        this.solConsole.addLine(`Unused space size: ${70000000 - root.size}.`);
        this.solConsole.addLine(`Should be cleared at least: ${root.size - 40000000}.`);
        this.solConsole.addLine(`Directory \"${dirToDelete.name}\" should be deleted.`);
        
        answer = dirToDelete.size;
      }

      // Visualize the file system with highlighted selected directories
      if (visualization) {
        let visConsole = new Console();
        this.visContainer.append(visConsole.container);
        root.draw(visConsole, "");
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
}

/**
 * Puzzle file system directory class.
 */
class Directory {
  /**
   * @param {string} name Directory name.
   * @param {Directory} parent Directory parent.
   */
  constructor(name, parent) {
    /**
     * Directory name.
     * @type {string}
     */
    this.name = name;
    /**
     * Parent directory.
     * @type {Directory}
     */
    this.parent = parent;
    /**
     * Subdirectories.
     * @type {Directory[]}
     */
    this.directories = [];
    /**
     * Files.
     * @type {File[]}
     */
    this.files = [];
    /**
     * Directory size.
     * @type {number}
     */
    this.size = 0;
    /**
     * Directory selection flag.
     * @type {boolean}
     */
    this.selected = false;
  }
  
  /**
   * Recursively calculates the size of the directory and all subdirectories.
   * @returns {number} Directory size.
   */
  calculateSize() {
    this.size = 0;

    for (let directory of this.directories)
      this.size += directory.calculateSize();

    for (let file of this.files)
      this.size += file.size;

    return this.size;
  }

  /**
   * Recursively visualizes the directory and file structure.
   * @param {Console} visConsole Visualization console.
   * @param {string} prefix Prefix for all displayed lines.
   */
  draw(visConsole, prefix) {
    let line = visConsole.addLine(`${prefix}[${this.name}] ${this.size}`);
    if (this.selected)
      line.classList.add("highlighted");
    prefix += " ";

    for (let directory of this.directories)
      directory.draw(visConsole, prefix);

    for (let file of this.files)
      visConsole.addLine(`${prefix}${file.name} ${file.size}`);
  }

  /**
   * Returns an recursively collected array of all directories.
   * @returns {Directory[]} All directories.
   */
  getAllDirectories() {
    let allDirectories = this.directories.slice();
    for (let directory of this.directories)
      allDirectories = allDirectories.concat(directory.getAllDirectories());
    return allDirectories;
  }
}

/**
 * Puzzle file system file class.
 */
class File {
  /**
   * @param {string} name File name.
   * @param {number} size File size.
   */
  constructor(name, size) {
    /**
     * File name.
     * @type {string}
     */
    this.name = name;
    /**
     * File size.
     * @type {number}
     */
    this.size = size;
  }
}