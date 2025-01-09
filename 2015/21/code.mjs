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
   * @returns {Player} Boss.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let lines = input.trim().split(/\r?\n/);

    if (lines.length != 3) 
      throw new Error("Input structure is not valid");

    let boss = new Player();

    let match;
    if ((match = lines[0].match(/^Hit Points: (\d+)$/)) == null) 
      throw new Error(`Invalid data in line 1`);
    boss.hitPoints = parseInt(match[1]);
    if ((match = lines[1].match(/^Damage: (\d+)$/)) == null) 
      throw new Error(`Invalid data in line 1`);
    boss.damage = parseInt(match[1]);
    if ((match = lines[2].match(/^Armor: (\d+)$/)) == null) 
      throw new Error(`Invalid data in line 1`);
    boss.armor = parseInt(match[1]);

    consoleLine.innerHTML += " done.";
    return boss;
  }

  /**
   * Finds the minimum amount of gold to spend and win the fight (part 1) or the maximum amount of gold that can be spent while still losing the fight (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Minimum amount of gold to spend and win the fight (part 1) or the maximum amount of gold that can be spent while still losing the fight (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let boss = this.parse(input);
      let player = boss.hitPoints < 100 ? new Player(8, 0, 0) : new Player(100, 0, 0);
      let weapons = [
        new Item("Dagger", 8, 4, 0),
        new Item("Shortsword", 10, 5, 0),
        new Item("Warhammer", 25, 6, 0),
        new Item("Longsword", 40, 7, 0),
        new Item("Greataxe", 74, 8, 0)
      ];
      let armors = [
        new Item("Leather", 13, 0, 1),
        new Item("Chainmail", 31, 0, 2),
        new Item("Splintmail", 53, 0, 3),
        new Item("Bandedmail", 75, 0, 4),
        new Item("Platemail", 102, 0, 5)
      ];
      let rings = [
        new Item("Damage +1", 25, 1, 0),
        new Item("Damage +2", 50, 2, 0),
        new Item("Damage +3", 100, 3, 0),
        new Item("Defense +1", 20, 0, 1),
        new Item("Defense +2", 40, 0, 2),
        new Item("Defense +3", 80, 0, 3)
      ];

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Create all possible inventories
      let inventories = [];
      for (let w = 0; w < weapons.length; w++) {
        for (let a = -1; a < armors.length; a++) {
          for (let r0 = -1; r0 < rings.length; r0++) {
            if (r0 >= 0) {
              inventories.push([weapons[w], ...(a >= 0 ? [armors[a]] : []), rings[r0]]);
              for (let r1 = r0 + 1; r1 < rings.length; r1++) {
                inventories.push([weapons[w], ...(a >= 0 ? [armors[a]] : []), rings[r0], rings[r1]]);
                for (let r2 = r1 + 1; r2 < rings.length; r2++) {
                  inventories.push([weapons[w], ...(a >= 0 ? [armors[a]] : []), rings[r0], rings[r1], rings[r2]]);
                }
              }
            }
            else
            inventories.push([weapons[w], ...(a >= 0 ? [armors[a]] : [])]);
          }
        }
      }

      // Find the inventory that allows to win with minimum cost
      let resultInventory = [];
      let resultCost = part == 1 ? Number.MAX_VALUE : 0;
      for (let inventory of inventories) {
        let cost = inventory.reduce((acc, e) => acc + e.cost, 0);
        player.damage = inventory.reduce((acc, e) => acc + e.damage, 0);
        player.armor = inventory.reduce((acc, e) => acc + e.armor, 0);

        // Player wins and cost is lower
        if (part == 1 && boss.hitPoints / (Math.max(1, player.damage - boss.armor)) <= player.hitPoints / (Math.max(1, boss.damage - player.armor)) && cost < resultCost) {
          resultCost = cost;
          resultInventory = inventory;
        }

        // Player loses and cost is higher
        if (part == 2 && boss.hitPoints / (Math.max(1, player.damage - boss.armor)) >= player.hitPoints / (Math.max(1, boss.damage - player.armor)) + 1 && cost > resultCost) {
          resultCost = cost;
          resultInventory = inventory;
        }
      }

      if (visualization) {
        player.damage = resultInventory.reduce((acc, e) => acc + e.damage, 0);
        player.armor = resultInventory.reduce((acc, e) => acc + e.armor, 0);
        visConsole.addLine("Player inventory:");
        resultInventory.forEach(e => visConsole.addLine(`${e.name}: damage = ${e.damage}, armor = ${e.armor}.`));
        visConsole.addLine();
        visConsole.addLine(`Total cost: ${resultCost}.`);
        visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
        visConsole.addLine();
        visConsole.addLine(`Player: damage = ${player.damage}, armor = ${player.armor}.`);
        visConsole.addLine(`Boss: damage = ${boss.damage}, armor = ${boss.armor}.`);
        visConsole.addLine();
        visConsole.addLine(`Player has ${player.hitPoints} hit points and loses ${Math.max(1, boss.damage - player.armor)} hit points every turn.`);
        visConsole.addLine(`Boss has ${boss.hitPoints} hit points and loses ${Math.max(1, player.damage - boss.armor)} hit points every turn.`);
        visConsole.addLine();
        visConsole.addLine(`Player needs ${Math.ceil(boss.hitPoints / Math.max(1, player.damage - boss.armor))} turns to win.`)
        visConsole.addLine(`Boss needs ${Math.ceil(player.hitPoints / Math.max(1, boss.damage - player.armor))} turns to win.`)
      }

      return resultCost;
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
 * Puzzle player class.
 */
class Player {
  /**
   * @param {number} hitPoints Hit points.
   * @param {number} damage Damage.
   * @param {number} armor Armor.
   */
  constructor(hitPoints, damage, armor) {
    /**
     * Hit points.
     * @type {number}
     */
    this.hitPoints = hitPoints;
    /**
     * Damage.
     * @type {number}
     */
    this.damage = damage;
    /**
     * Armor.
     * @type {number}
     */
    this.armor = armor;
  }
}

/**
 * Puzzle item class.
 */
class Item {
  /**
   * @param {string} name Name.
   * @param {number} cost Cost.
   * @param {number} damage Damage.
   * @param {number} armor Armor.
   */
  constructor(name, cost, damage, armor) {
    /**
     * Name.
     * @type {string}
     */
    this.name = name;
    /**
     * Cost.
     * @type {number}
     */
    this.cost = cost;
    /**
     * Damage.
     * @type {number}
     */
    this.damage = damage;
    /**
     * Armor.
     * @type {number}
     */
    this.armor = armor;
  }
}