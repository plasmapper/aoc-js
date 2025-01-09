import { delay, Console, PriorityQueue } from "../../utility.mjs";

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
   * @returns {{
   * replacements: Replacement[],
   * medicineMolecule: string
   * }} Replacements and medicine molecule.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let blocks = input.trimEnd().split(/\r?\n\r?\n/);
    if (blocks.length != 2)
      throw new Error("Input structure is not valid");

    let replacements = blocks[0].split(/\r?\n/).map((line, index) => {
      let match;
      if ((match = line.match(/^(.+) => (.+)$/)) == null)
        throw new Error(`Invalid data in block 1 line ${index + 1}`);
      return new Replacement(match[1], match[2]);
    });

    let medicineMolecule = blocks[1].trim();

    consoleLine.innerHTML += " done.";
    return {replacements, medicineMolecule};
  }

  /**
   * Finds the number of distinct molecules after 1 replacement (part 1) or the minimum number of replacements to go from "e" to the medicine molecule (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of distinct molecules (part 1) or the minimum number of replacements to go from "e" to the medicine molecule (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {replacements, medicineMolecule} = this.parse(input);

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Find the number of distinct molecules after 1 replacement (part 1)
      if (part == 1) {
        let molecules = new Map();
        for (let replacement of replacements) {
          for (let i = 0; i >= 0 && i < medicineMolecule.length;) {
            i = medicineMolecule.indexOf(replacement.from, i);
            if (i >= 0) {
              let newMolecule = medicineMolecule.substring(0, i) + medicineMolecule.substring(i).replace(replacement.from, replacement.to);
              molecules.set(newMolecule, new FabricationStep(replacement, i));
              i += replacement.from.length;
            }
          }
        }
  
        if (visualization) {
          for (let [molecule, step] of molecules) {
            visConsole.addLine(`${step.replacement.from} => ${step.replacement.to}`);
            visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
            let start = molecule.substring(0, step.index);
            let replacedPart = step.replacement.to;
            let end = molecule.substring(step.index + step.replacement.to.length);
            visConsole.addLine(`${start}<span class="strongly-highlighted">${replacedPart}</span>${end}`);
            visConsole.lines[visConsole.lines.length - 1].style.overflowWrap = "break-word";
            visConsole.addLine();
          }
        }

        return molecules.size;
      }

      // Find the minimum number of replacements to go from "e" to the medicine molecule (part 2)
      else {
        let queue = new PriorityQueue();
        queue.enqueue(new Fabrication(medicineMolecule, []), medicineMolecule.length);

        // Apply reverse replacements until "e" is reached
        // Priority queue prioritizes molecules with smaller size
        while (queue.getSize()) {
          let fabrication = queue.dequeue();
          let molecule = fabrication.molecule;

          for (let replacement of replacements) {
            for (let i = 0; i >= 0 && i < molecule.length;) {
              i = molecule.indexOf(replacement.to, i);
              if (i >= 0) {
                let newMolecule = molecule.substring(0, i) + replacement.from + molecule.substring(i + replacement.to.length);
                let newFabrication = new Fabrication(newMolecule, fabrication.steps.slice());
                newFabrication.steps.push(new FabricationStep(replacement, i));

                // If "e" is reached
                if (newMolecule == "e") {
                  if (visualization) {
                    let molecule = "e";
                    newFabrication.steps.reverse();
                    for (let step of newFabrication.steps) {
                      visConsole.addLine(`${step.replacement.from} => ${step.replacement.to}`);
                      visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
                      let start = molecule.substring(0, step.index);
                      let replacedPart = step.replacement.to;
                      let end = molecule.substring(step.index + step.replacement.from.length);
                      visConsole.addLine(`${start}<span class="strongly-highlighted">${replacedPart}</span>${end}`);
                      visConsole.lines[visConsole.lines.length - 1].style.overflowWrap = "break-word";
                      visConsole.addLine();

                      molecule = start + replacedPart + end;
                    }
                  }
                  
                  return fabrication.steps.length + 1;
                }

                // If the replacement is not a "e" replacement ("e" replacement can only occur at the very end)
                if (replacement.from != "e")
                  queue.enqueue(newFabrication, newMolecule.length);

                i += replacement.to.length;
              }
            }
          }
        }
       
        throw new Error("Solution not found");
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

/**
 * Puzzle replacement class.
 */
class Replacement {
  /**
   * @param {string} from From.
   * @param {string} to To.
   */
  constructor(from, to) {
    /**
     * From.
     * @type {string}
     */
    this.from = from;
    /**
     * To.
     * @type {string}
     */
    this.to = to;
  }
}

/**
 * Puzzle fabrication class.
 */
class Fabrication {
  /**
   * @param {string} molecule Molecule.
   * @param {FabricationStep[]} steps Steps.
   */
  constructor(molecule, steps) {
    /**
     * Molecule.
     * @type {string}
     */
    this.molecule = molecule;
    /**
     * Steps.
     * @type {FabricationStep[]}
     */
    this.steps = steps;
  }
}

/**
 * Puzzle fabrication class.
 */
class FabricationStep {
  /**
   * @param {Replacement} replacement Replacement.
   * @param {number} index Index.
   */
  constructor(replacement, index) {
    /**
     * Replacement.
     * @type {Replacement}
     */
    this.replacement = replacement;
    /**
     * Index.
     * @type {number}
     */
    this.index = index;
  }
}