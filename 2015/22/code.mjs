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

    if (lines.length != 2) 
      throw new Error("Input structure is not valid");

    let boss = new Boss();

    let match;
    if ((match = lines[0].match(/^Hit Points: (\d+)$/)) == null) 
      throw new Error(`Invalid data in line 1`);
    boss.hitPoints = parseInt(match[1]);
    if ((match = lines[1].match(/^Damage: (\d+)$/)) == null) 
      throw new Error(`Invalid data in line 1`);
    boss.damage = parseInt(match[1]);

    consoleLine.innerHTML += " done.";
    return boss;
  }

  /**
   * Finds the minimum amount of mana that needs to be spent to win the fight.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Minimum amount of mana that needs to be spent to win the fight.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let boss = this.parse(input);
      let player = boss.hitPoints < 20 ? new Player(10, 0, 500, 0) : new Player(50, 0, 500, 0);
      let spells = [
        new Spell("Magic Missile", 53, 0, situation => situation.boss.hitPoints = Math.max(0, situation.boss.hitPoints - 4), () => {}, () => {},
          "damage: 4", null, null),
        new Spell("Drain", 73, 0, situation => {situation.boss.hitPoints = Math.max(0, situation.boss.hitPoints - 2); situation.player.hitPoints += 2}, () => {}, () => {},
          "damage: 4, healing: 2", null, null),
        new Spell("Shield", 113, 6, situation => situation.player.armor += 7, () => {}, situation => situation.player.armor -= 7,
          "armor: 7", null, "armor: 0"),
        new Spell("Poison", 173, 6, () => {}, situation => situation.boss.hitPoints = Math.max(0, situation.boss.hitPoints - 3), () => {},
          null, "damage: 3", null),
        new Spell("Recharge", 229, 5, () => {}, situation => situation.player.mana += 101, () => {},
          null, "mana: 101", null)
      ];
     
      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let initialSituation = new Situation(player, boss, new Map(), []);
      let situations = [initialSituation];
      let resultSituation = null;

      while (situations.length) {
        let situation = situations.pop();
        // Lose 1 hit point (part 2)
        if (part == 2)
          situation.player.hitPoints--;

        // Cast possible spells
        if (situation.player.hitPoints > 0) {
        for (let spell of spells) {
          if (spell.cost <= situation.player.mana) {
            let newSituation = situation.cast(spell, false);
            if (newSituation.boss.hitPoints <= 0) {
              if (resultSituation == null || newSituation.player.manaSpent < resultSituation.player.manaSpent)
                resultSituation = newSituation;
            }
            else if (newSituation.player.hitPoints > 0 && (resultSituation == null || newSituation.player.manaSpent < resultSituation.player.manaSpent))
              situations.push(newSituation);
          }
        }
        }
      }

      if (resultSituation == null)
        throw new Error ("Solution not found");

      if (visualization) {
        let situation = initialSituation;
        console.log(resultSituation.spellHistory)
        for (let spell of resultSituation.spellHistory)
          situation = situation.cast(spell, true, visConsole);
      }

      return resultSituation.player.manaSpent;
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
   * @param {number} armor Armor.
   * @param {number} mana Mana.
   * @param {number} manaSpent Mana spent.
   */
  constructor(hitPoints, armor, mana, manaSpent) {
    /**
     * Hit points.
     * @type {number}
     */
    this.hitPoints = hitPoints;
    /**
     * Armor.
     * @type {number}
     */
    this.armor = armor;
    /**
     * Mana.
     * @type {number}
     */
    this.mana = mana;
    /**
     * Mana spent.
     * @type {number}
     */
    this.manaSpent = manaSpent;
  }
}

/**
 * Puzzle boss class.
 */
class Boss {
  /**
   * @param {number} hitPoints Hit points.
   * @param {number} damage Damage.
   */
  constructor(hitPoints, damage) {
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
  }
}

/**
 * Puzzle spell class.
 */
class Spell {
  /**
   * @param {string} name Name.
   * @param {number} cost Cost.
   * @param {number} duration Duration.
   * @param {function(Situation):void} startAction Start action.
   * @param {function(Situation):void} action Action.
   * @param {function(Situation):void} endAction End action.
   * @param {string} startMessage Start message.
   * @param {string} actionMessage Action message.
   * @param {string} endMessage End message.
   */
  constructor(name, cost, duration, startAction, action, endAction, startMessage, actionMessage, endMessage) {
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
     * Duration.
     * @type {number}
     */
    this.duration = duration;
    /**
     * Start action.
     * @type {function(Situation):void}
     */
    this.startAction = startAction;
    /**
     * Action.
     * @type {function(Situation):void}
     */
    this.action = action;
    /**
     * End action.
     * @type {function(Situation):void}
     */
    this.endAction = endAction;
    /**
     * Start message.
     * @type {string}
     */
    this.startMessage = startMessage;
    /**
     * Action message.
     * @type {string}
     */
    this.actionMessage = actionMessage;
    /**
     * End message.
     * @type {string}
     */
    this.endMessage = endMessage;
  }
}

/**
 * Puzzle situation class.
 */
class Situation {
  /**
   * @param {Player} player Player.
   * @param {Boss} boss Boss.
   * @param {Map<Spell,number>} activeSpells Active spells (key: spell, number: timer).
   * @param {Spell[]} spellHistory Spell history.
   */
  constructor(player, boss, activeSpells, spellHistory) {
    /**
     * Player.
     * @type {Player}
     */
    this.player = player;
    /**
     * Boss.
     * @type {Boss}
     */
    this.boss = boss;
    /**
     * Active spells (key: spell, number: timer).
     * @type {Map<Spell,number>}
     */
    this.activeSpells = activeSpells;
    /**
     * Spell history.
     * @type {Spell[]}
     */
    this.spellHistory = spellHistory;
  }

  /**
   * Casts a spell and returns a situation at the next turn of the player.
   * @param {Spell} spell Spell.
   * @param {boolean} visualization Enable visualization.
   * @param {Console} visConsole Visualization console.
   * @returns {Situation} Situation at the next turn of the player.
   */
  cast(spell, visualization, visConsole) {
    let situation = new Situation(
      new Player(this.player.hitPoints, this.player.armor, this.player.mana, this.player.manaSpent + spell.cost),
      new Boss(this.boss.hitPoints, this.boss.damage),
      new Map(this.activeSpells),
      this.spellHistory.slice());

    situation.spellHistory.push(spell);

    for (let turn = 0; turn < 2; turn++) {
      if (visualization) {
        visConsole.addLine(`-- ${turn == 0 ? "Player" : "Boss"} turn --`);
        visConsole.addLine(`Player has ${situation.player.hitPoints} hit points, ${situation.player.armor} armor, ${situation.player.mana} mana`);
        visConsole.addLine(`Boss has ${situation.boss.hitPoints} hit points`);
      }

      for (let [activeSpell, timer] of situation.activeSpells) {
        activeSpell.action(situation);
        timer--;
        if (timer <= 0) {
          if (visualization)
            visConsole.addLine(`${activeSpell.name} ends${activeSpell.endMessage != null ? ` (${activeSpell.endMessage})` : ""}`);
          activeSpell.endAction(situation);
          situation.activeSpells.delete(activeSpell);
        }
        else {
          if (visualization)
            visConsole.addLine(`${activeSpell.name} is active (${activeSpell.actionMessage != null ? `${activeSpell.actionMessage}, ` : ""}timer: ${timer})`);
          situation.activeSpells.set(activeSpell, timer);
        }
      }

      if (turn == 0) {
        if (visualization)
          visConsole.addLine(`Player casts ${spell.name}${spell.startMessage != null ? ` (${spell.startMessage})` : ""}.`);
        situation.player.mana -= spell.cost;
        spell.startAction(situation);
        if (spell.duration > 0)
          situation.activeSpells.set(spell, spell.duration);
      }
      else {
        if (situation.boss.hitPoints > 0) {
          let damage = Math.max(1, (situation.boss.damage - situation.player.armor));
          if (visualization)
            visConsole.addLine(`Boss attacks for ${situation.boss.damage} damage.`);
          situation.player.hitPoints = Math.max(0, situation.player.hitPoints - damage);
        }
      }

      if (visualization)
        visConsole.addLine();

      if (situation.boss.hitPoints <= 0) {
        if (visualization)
          visConsole.addLine(`Player wins.`);
        return situation;
      }
      if (situation.player.hitPoints <= 0) {
        if (visualization)
          visConsole.addLine(`Boss wins.`);
        return situation;
      }
    }

    return situation;
  }
}