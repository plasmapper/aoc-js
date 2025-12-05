import { delay, Console, Range } from "../../utility.mjs";

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
   * workflows: Workflow[],
   * parts: Part[]
   * }} Workflows and parts.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let blocks = input.trim().split(/\r?\n\r?\n/);
    if (blocks.length != 2)
      throw new Error("Input structure is not valid");
    
    let workflows = blocks[0].split(/\r?\n/).map((line, index) => {
      let match = line.match(/^(.+){(.+)}$/);
      if (match == null)
        throw new Error(`Invalid data in block 1 line ${index + 1}`);
      let workflow = new Workflow(match[1]);
      for (let stepString of match[2].split(",")) {
        let step;
        match = stepString.match(/^([xmas])([<>])(\d+):(.+)$/);
        if (match != null)
          step = new WorkflowStep(match[1], match[2], parseInt(match[3]), match[4]);
        else
          step = new WorkflowStep("", "", 0, stepString);
        workflow.steps.push(step);
      }
      return workflow;
    });

    for (let workflow of workflows) {
      for (let step of workflow.steps) {
        if (step.destinationName != "A" && step.destinationName != "R") {
          let destinationWorkflow = workflows.find(w => w.name == step.destinationName);
          if (destinationWorkflow == undefined)
            throw new Error(`Invalid destination workflow ${step.destinationName} in workflow ${workflow.name}`);
          step.destinationWorkflow = destinationWorkflow;
        }
      }
    }

    let parts = blocks[1].split(/\r?\n/).map((line, index) => {
      let match = line.match(/^{x=(\d+),m=(\d+),a=(\d+),s=(\d+)}$/);
      if (match == null)
        throw new Error(`Invalid data in block 2 line ${index + 1}`);
      return new Part(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseInt(match[4]));
    });

    consoleLine.innerHTML += " done.";
    return { workflows, parts };
  }

  /**
   * Calculates the sum of the acccepted part ratings (part 1) or number of accepted rating combinations (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of the acccepted part ratings (part 1) or number of accepted rating combinations (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let {workflows, parts} = this.parse(input);
      let inWorkflow = workflows.find(w => w.name == "in");
      if (inWorkflow == undefined)
        throw new Error(`Workflow "in" not found`);

      let acceptedRanges = inWorkflow.findAcceptedRatingRanges(new RatingRanges(new Range(1, 4000), new Range(1, 4000), new Range(1, 4000), new Range(1, 4000)));

      let visConsole = new Console();
      if (visualization) {
        this.visContainer.append(visConsole.container);
        visConsole.addLine("Accepted ranges:")

        for (let range of acceptedRanges) {
          visConsole.addLine(`x: ${range.x.from}..${range.x.to}\nm: ${range.m.from}..${range.m.to}\na: ${range.a.from}..${range.a.to}\ns: ${range.s.from}..${range.s.to}`);
          visConsole.addLine();
        }
      }

      if (part == 1) {
        let sumOfRatings = 0;

        if (visualization)
          visConsole.addLine("Accepted parts:");

        for (let part of parts) {
          for (let ranges of acceptedRanges) {
            if (ranges.x.contains(part.x) && ranges.m.contains(part.m) && ranges.a.contains(part.a) && ranges.s.contains(part.s)) {
              sumOfRatings += part.x + part.m + part.a + part.s;
              if (visualization)
                visConsole.addLine(`x = ${part.x}, m = ${part.m}, a = ${part.a}, s = ${part.s}`);
            }
          }
        }

        return sumOfRatings;
      }
      else {
        let numberOfCombinations = 0;
        for (let ranges of acceptedRanges)
          numberOfCombinations += (ranges.x.to - ranges.x.from + 1) * (ranges.m.to - ranges.m.from + 1) * (ranges.a.to - ranges.a.from + 1) * (ranges.s.to - ranges.s.from + 1);
      
        return numberOfCombinations;
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
 * Puzzle part class.
 */
class Part {
  /**
   * @param {number} x Part "x" rating.
   * @param {number} m Part "m" rating.
   * @param {number} a Part "a" rating.
   * @param {number} s Part "s" rating.
   */
  constructor(x, m, a, s) {
    /**
     * Part "x" rating.
     * @type {RatingRanges}
     */
    this.x = x;
    /**
     * Part "m" rating.
     * @type {RatingRanges}
     */
    this.m = m;
    /**
     * Part "a" rating.
     * @type {RatingRanges}
     */
    this.a = a;
    /**
     * Part "s" rating.
     * @type {RatingRanges}
     */
    this.s = s;
  }
}

/**
 * Puzzle part rating range class.
 */
class RatingRanges {
  /**
   * @param {Range} x Part "x" rating range
   * @param {Range} m Part "m" rating range
   * @param {Range} a Part "a" rating range
   * @param {Range} s Part "s" rating range
   */
  constructor(x, m, a, s) {
    /**
     * Part "x" rating range.
     * @type {Range}
     */
    this.x = x;
    /**
     * Part "m" rating range.
     * @type {Range}
     */
    this.m = m;
    /**
     * Part "a" rating range.
     * @type {Range}
     */
    this.a = a;
    /**
     * Part "s" rating range.
     * @type {Range}
     */
    this.s = s;
  }

  /**
   * Returns a copy of the class.
   * @returns {RatingRanges} Copy of the class.
   */
  clone() {
    return new RatingRanges(this.xRange.clone(), this.mRange.clone(), this.aRange.clone(), this.sRange.clone());
  }
}

/**
 * Puzzle workflow step class.
 */
class WorkflowStep {
  /**
   * @param {string} compRating Comparison rating.
   * @param {string} compAction Comparison action.
   * @param {number} value Comparison value.
   * @param {string} destinationName Destination name.
   */
  constructor(compRating, compAction, value, destinationName) {
    /**
     * Comparison rating.
     * @type {string}
     */
    this.compRating = compRating;
    /**
     * Comparison action.
     * @type {string}
     */
    this.compAction = compAction;
    /**
     * Comparison value.
     * @type {number}
     */
    this.compValue = value;
    /**
     * Destination name.
     * @param {string} destinationName 
     */
    this.destinationName = destinationName;
    /**
     * Step action is "accept".
     */
    this.accept = false;
    /**
     * Step action is "accept".
     */
    this.reject = false;
    /**
     * Step action destination workflow.
     * @type {Workflow}
     */
    this.destinationWorkflow = null;
  }
}

/**
 * Puzzle workflow class.
 */
class Workflow {
  /**
   * @param {string} name Workflow name.
   */
  constructor(name) {
    /**
     * Workflow name.
     * @type {name}
     */
    this.name = name
    /**
     * Workflow steps.
     * @type {WorkflowStep[]}
     */
    this.steps = [];
  }

  /**
   * Finds accepted rating ranges from the input rating ranges.
   * @param {RatingRanges} ranges Input rating ranges.
   * @returns {RatingRanges[]} Accepted rating ranges.
   */
  findAcceptedRatingRanges(ranges) {
    let acceptedRanges = [];

    for (let step of this.steps) {
      if (ranges != null) {
        let stepCompValue = step.compAction == ">" ? step.compValue + 1 : step.compValue;
        let satisfactoryRangeIndex = step.compAction == ">" ? 1 : 0;
        let rangesThatSatisfyComparison = null;
        let rangesThatDoNotSatisfyComparison = null;
    
        let rangeParts;
        switch(step.compRating) {
          case "x":
            rangeParts = ranges.x.split(stepCompValue);
            if (rangeParts[satisfactoryRangeIndex] != null)
              rangesThatSatisfyComparison = new RatingRanges(rangeParts[satisfactoryRangeIndex], ranges.m, ranges.a, ranges.s);
            if (rangeParts[1 - satisfactoryRangeIndex] != null)
              rangesThatDoNotSatisfyComparison = new RatingRanges(rangeParts[1 - satisfactoryRangeIndex], ranges.m, ranges.a, ranges.s);
            break;
          
          case "m":
            rangeParts = ranges.m.split(stepCompValue);
            if (rangeParts[satisfactoryRangeIndex] != null)
              rangesThatSatisfyComparison = new RatingRanges(ranges.x, rangeParts[satisfactoryRangeIndex], ranges.a, ranges.s);
            if (rangeParts[1 - satisfactoryRangeIndex] != null)
              rangesThatDoNotSatisfyComparison = new RatingRanges(ranges.x, rangeParts[1 - satisfactoryRangeIndex], ranges.a, ranges.s);
            break;
  
          case "a":
            rangeParts = ranges.a.split(stepCompValue);
            if (rangeParts[satisfactoryRangeIndex] != null)
              rangesThatSatisfyComparison = new RatingRanges(ranges.x, ranges.m, rangeParts[satisfactoryRangeIndex], ranges.s);
            if (rangeParts[1 - satisfactoryRangeIndex] != null)
              rangesThatDoNotSatisfyComparison = new RatingRanges(ranges.x, ranges.m, rangeParts[1 - satisfactoryRangeIndex], ranges.s);
            break;
  
          case "s":
            rangeParts = ranges.s.split(stepCompValue);
            if (rangeParts[satisfactoryRangeIndex] != null)
              rangesThatSatisfyComparison = new RatingRanges(ranges.x, ranges.m, ranges.a, rangeParts[satisfactoryRangeIndex]);
            if (rangeParts[1 - satisfactoryRangeIndex] != null)
              rangesThatDoNotSatisfyComparison = new RatingRanges(ranges.x, ranges.m, ranges.a, rangeParts[1 - satisfactoryRangeIndex]);
            break;
          
          default:
            rangesThatSatisfyComparison = ranges;
            break;
        }

        if (rangesThatSatisfyComparison != null) {
          if (step.destinationName == "A")
            acceptedRanges.push(rangesThatSatisfyComparison);
          else if (step.destinationName != "R")
            acceptedRanges = acceptedRanges.concat(step.destinationWorkflow.findAcceptedRatingRanges(rangesThatSatisfyComparison));
        }
  
        ranges = rangesThatDoNotSatisfyComparison;
      }
    }

    return acceptedRanges;
  }
}