import { delay, Console } from "../../utility.mjs";

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
   * @returns {Blueprint[]} Blueprints.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let blueprints = [];

  input.trim().split(/\r?\n/).forEach((line, lineIndex) => {
    let match;
    if ((match = line.match(/^Blueprint (\d+): Each ore robot costs (\d+) ore. Each clay robot costs (\d+) ore. Each obsidian robot costs (\d+) ore and (\d+) clay. Each geode robot costs (\d+) ore and (\d+) obsidian.$/)) == null)
      throw new Error(`Invalid data in line ${lineIndex + 1}`);
    if (match[1] != lineIndex + 1)
      throw new Error(`Invalid blueprint number in line ${lineIndex + 1}`);
    blueprints.push(new Blueprint(
      new Resources(parseInt(match[2]), 0, 0, 0),
      new Resources(parseInt(match[3]), 0, 0, 0),
      new Resources(parseInt(match[4]), parseInt(match[5]), 0, 0),
      new Resources(parseInt(match[6]), 0, parseInt(match[7]), 0)));
  });
   
  consoleLine.innerHTML += " done.";
  return blueprints;
}

  /**
   * Finds the sum of the blueprint quality levels (part 1) or the product of the largest number of geodes for the first 3 blueprints (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of the blueprint quality levels (part 1) or the product of the largest number of geodes for the first 3 blueprints (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let blueprints = this.parse(input);
      let numberOfMinutes = part == 1 ? 24 : 32;
      if (part == 2)
        blueprints = blueprints.slice(0, 3);

      let blueprint = blueprints[0];

      let maxOreRobots = Math.max(blueprint.clayRobot.ore, blueprint.obsidianRobot.ore, blueprint.geodeRobot.ore);
      let maxClayRobots = blueprint.obsidianRobot.clay;
      let maxObsidianRobots = blueprint.geodeRobot.obsidian;

      let noRobotsProduction = new Production();
      noRobotsProduction.resources = new Array(numberOfMinutes).fill(0).map((e, i) => new Resources(i, 0, 0, 0));
      let productions = [noRobotsProduction];

      return 0;
    }

    
    finally {
      this.isSolving = false;
    }
  }

  findMaxNumberOfGeodes(blueprint, resources, robots, minutesLeft) {
    
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

class Production {
  constructor() {
    this.ore = [];
    this.clay = [];
    this.obsidian = [];
    this.geode = [];
    this.resources;
  }
}

/**
 * Puzzle resources class.
 */
class Resources {
  /**
   * @param {number} ore Ore.
   * @param {number} clay Clay.
   * @param {number} obsidian Obsidian.
   * @param {number} geode Geode.
   */
  constructor(ore, clay, obsidian, geode) {
    /**
     * Ore.
     * @type {number}
     */
    this.ore = ore;
    /**
     * Clay.
     * @type {number}
     */
    this.clay = clay;
    /**
     * Obsidian.
     * @type {number}
     */
    this.obsidian = obsidian;
    /**
     * Geode.
     * @type {number}
     */
    this.geode = geode;
  }
  
  /**
   * Adds resources.
   * @param {Resources} resources Resources to add.
   * @returns {Resources} Result resources.
   */
  add(resources) {
    return new Resources(this.ore + resources.ore, this.clay + resources.clay, this.obsidian + resources.obsidian, this.geode + resources.geode);
  }

  /**
   * Subtracts resources.
   * @param {Resources} resources Resources to subtract.
   * @returns {Resources} Result resources.
   */
  subtract(resources) {
    return new Resources(this.ore - resources.ore, this.clay - resources.clay, this.obsidian - resources.obsidian, this.geode - resources.geode);
  }

  /**
   * Returns true if all resources are greater or equal compared to other resources.
   * @param {Resources} resources Resources to compare with.
   * @returns {boolean} True if all resources are greater or equal compared to other resources.
   */
  areGreaterOrEqualThan(resources) {
    return this.ore >= resources.ore && this.clay >= resources.clay && this.obsidian >= resources.obsidian && this.geode >= resources.geode;
  }
}

/**
 * Puzzle blueprint class.
 */
class Blueprint {
  /**
   * @param {Resources} oreRobot Ore robot.
   * @param {Resources} clayRobot Clay robot.
   * @param {Resources} obsidianRobot Obsidian robot.
   * @param {Resources} geodeRobot Geode robot.
   */
  constructor(oreRobot, clayRobot, obsidianRobot, geodeRobot) {
    /**
     * Ore robot.
     * @type {Resources}
     */
    this.oreRobot = oreRobot;
    /**
     * Clay robot.
     * @type {Resources}
     */
    this.clayRobot = clayRobot;
    /**
     * Obsidian robot.
     * @type {Resources}
     */
    this.obsidianRobot = obsidianRobot;
    /**
     * Geode robot.
     * @type {Resources}
     */
    this.geodeRobot = geodeRobot;
  }
}