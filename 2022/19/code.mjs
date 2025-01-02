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

  let blueprints = input.trim().split(/\r?\n/).map((line, lineIndex) => {
    let match;
    if ((match = line.match(/^Blueprint (\d+): Each ore robot costs (\d+) ore. Each clay robot costs (\d+) ore. Each obsidian robot costs (\d+) ore and (\d+) clay. Each geode robot costs (\d+) ore and (\d+) obsidian.$/)) == null)
      throw new Error(`Invalid data in line ${lineIndex + 1}`);
    if (match[1] != lineIndex + 1)
      throw new Error(`Invalid blueprint number in line ${lineIndex + 1}`);
    return new Blueprint(
      new Resources(parseInt(match[2]), 0, 0, 0),
      new Resources(parseInt(match[3]), 0, 0, 0),
      new Resources(parseInt(match[4]), parseInt(match[5]), 0, 0),
      new Resources(parseInt(match[6]), 0, parseInt(match[7]), 0));
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

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let sumOfQualityLevels = 0;
      let productOfMaxNumbersOfGeodes = 1;

      for (let i = 0; i < blueprints.length; i++) {
        let blueprint = blueprints[i];
        let productionStates = [new ProductionState(new Resources(0, 0, 0, 0), new Resources(1, 0, 0, 0), numberOfMinutes)];
        let maxNumberOfGeodes = 0;

        while (productionStates.length) {
          let productionState = productionStates.pop();
          let resources = productionState.resources;
          let robots = productionState.robots;
          let minutesLeft = productionState.minutesLeft;
  
          if (minutesLeft == 0) {
            if (resources.geode > maxNumberOfGeodes)
              maxNumberOfGeodes = resources.geode;
          }
          else {
            // Create new production plans by building required robots
            let oreRobotIsRequired = (resources.ore + robots.ore * (minutesLeft - 2) < (Math.max(blueprint.clayRobot.ore, blueprint.obsidianRobot.ore, blueprint.geodeRobot.ore) * (minutesLeft - 2)));
            let obsidianRobotIsRequired = resources.obsidian + robots.obsidian * (minutesLeft - 2) < blueprint.geodeRobot.obsidian * (minutesLeft - 2);
            let clayRobotIsRequired = resources.clay + robots.clay * (minutesLeft - 4) < blueprint.obsidianRobot.clay * (minutesLeft - 4);
  
            if (oreRobotIsRequired)
              productionStates.push(productionState.buildOreRobot(blueprint));
            if (clayRobotIsRequired)
              productionStates.push(productionState.buildClayRobot(blueprint));
            if (robots.clay > 0 && obsidianRobotIsRequired)
              productionStates.push(productionState.buildObsidianRobot(blueprint));
            if (robots.obsidian > 0)
              productionStates.push(productionState.buildGeodeRobot(blueprint));
          }
        }

        let qualityLevel = maxNumberOfGeodes * (i + 1);

        if (visualization) {
          visConsole.addLine(`Blueprint ${i + 1}:`);
          visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          visConsole.addLine(`Max number of geodes after ${numberOfMinutes} minutes: ${maxNumberOfGeodes}.`);
          if (part == 1)
            visConsole.addLine(`Quality level: ${qualityLevel}.`);
          visConsole.addLine();
        }

        sumOfQualityLevels += qualityLevel;
        productOfMaxNumbersOfGeodes *= maxNumberOfGeodes;
      }

      return part == 1 ? sumOfQualityLevels : productOfMaxNumbersOfGeodes;
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
   * Clones the resources.
   * @returns {Resources} Resources clone.
   */
  clone() {
    return new Resources(this.ore, this.clay, this.obsidian, this.geode);
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

/**
 * Puzzle production state class.
 */
class ProductionState {
  /**
   * @param {Resources} resources Resources.
   * @param {Resources} robots Robots.
   * @param {number} minutesLeft Number of minutes left.
   */
  constructor(resources, robots, minutesLeft) {
    /**
     * Resources.
     * @type {Resources}
     */
    this.resources = resources;
    /**
     * Robots.
     * @type {Resources}
     */
    this.robots = robots;
    /**
     * Number of minutes left.
     * @type {number}
     */
    this.minutesLeft = minutesLeft;
  }

  /**
   * Creates a new production state after harvesting the resources for the specified number of minutes.
   * @param {number} numberOfMinutes Number of minutes.
   * @returns {ProductionState} New production state.
   */
  harvest(numberOfMinutes) {
    let newProductionState = new ProductionState(this.resources.clone(), this.robots.clone(), this.minutesLeft);
    if (numberOfMinutes == 0)
      return newProductionPlan;
    
    newProductionState.resources.ore += newProductionState.robots.ore * numberOfMinutes;
    newProductionState.resources.clay += newProductionState.robots.clay * numberOfMinutes;
    newProductionState.resources.obsidian += newProductionState.robots.obsidian * numberOfMinutes;
    newProductionState.resources.geode += newProductionState.robots.geode * numberOfMinutes;
    newProductionState.minutesLeft -= numberOfMinutes;
    return newProductionState;
  }

  /**
   * Creates a new production state after building an ore robot.
   * @param {Blueprint} blueprint Blueprint.
   * @returns {ProductionState} New production state.
   */
  buildOreRobot(blueprint) {
    let numberOfMinutes = Math.max(1, Math.min(this.minutesLeft, Math.ceil((blueprint.oreRobot.ore - this.resources.ore) / this.robots.ore) + 1));
    let newProductionState = this.harvest(numberOfMinutes);
    if (newProductionState.minutesLeft >= 0) {
      newProductionState.resources.ore -= blueprint.oreRobot.ore;
      newProductionState.robots.ore++;
    }
    return newProductionState;
  }

  /**
   * Creates a new production state after building a clay robot.
   * @param {Blueprint} blueprint Blueprint.
   * @returns {ProductionState} New production state.
   */
  buildClayRobot(blueprint) {
    let numberOfMinutes = Math.max(1, Math.min(this.minutesLeft, Math.ceil((blueprint.clayRobot.ore - this.resources.ore) / this.robots.ore) + 1));
    let newProductionState = this.harvest(numberOfMinutes);
    if (newProductionState.minutesLeft >= 0) {
      newProductionState.resources.ore -= blueprint.clayRobot.ore;
      newProductionState.robots.clay++;
    }
    return newProductionState;
  }

  /**
   * Creates a new production state after building an obsidian robot.
   * @param {Blueprint} blueprint Blueprint.
   * @returns {ProductionState} New production state.
   */
  buildObsidianRobot(blueprint) {
    let numberOfMinutes = Math.max(1, Math.min(this.minutesLeft, Math.ceil(Math.max((blueprint.obsidianRobot.ore - this.resources.ore) / this.robots.ore,
      (blueprint.obsidianRobot.clay - this.resources.clay) / this.robots.clay)) + 1));
    let newProductionState = this.harvest(numberOfMinutes);
    if (newProductionState.minutesLeft >= 0) {
      newProductionState.resources.ore -= blueprint.obsidianRobot.ore;
      newProductionState.resources.clay -= blueprint.obsidianRobot.clay;
      newProductionState.robots.obsidian++;
    }
    return newProductionState;
  }
  
  /**
   * Creates a new production state after building a geode robot.
   * @param {Blueprint} blueprint Blueprint.
   * @returns {ProductionState} New production state.
   */
  buildGeodeRobot(blueprint) {
    let numberOfMinutes = Math.max(1, Math.min(this.minutesLeft, Math.ceil(Math.max((blueprint.geodeRobot.ore - this.resources.ore) / this.robots.ore,
      (blueprint.geodeRobot.obsidian - this.resources.obsidian) / this.robots.obsidian)) + 1));
    let newProductionState = this.harvest(numberOfMinutes);
    if (newProductionState.minutesLeft >= 0) {
      newProductionState.resources.ore -= blueprint.geodeRobot.ore;
      newProductionState.resources.obsidian -= blueprint.geodeRobot.obsidian;
      newProductionState.robots.geode++;
    }
    return newProductionState;
  }
}