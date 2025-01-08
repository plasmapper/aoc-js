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
   * @returns {Ingredient[]} Ingredients.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let ingredients = input.trim().split(/\r?\n/).map((line, index) => {
      let match;
      if ((match = line.match(/^(.+): capacity (-?\d+), durability (-?\d+), flavor (-?\d+), texture (-?\d+), calories (-?\d+)$/)) == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return new Ingredient(match[1], parseInt(match[2]), parseInt(match[3]), parseInt(match[4]), parseInt(match[5]), parseInt(match[6]));
    });

    consoleLine.innerHTML += " done.";
    return ingredients;
  }

  /**
   * Finds the total score of the highest-scoring cookie.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Total score of the highest-scoring cookie.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let ingredients = this.parse(input);
      let numberOfTeaspoons = 100;

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Find all recipes
      let recipes = [new Array(numberOfTeaspoons + 1).fill(0).map((e, i) => [i])];
      for (let i = 0; i < ingredients.length - 1; i++) {
        recipes.push([]);
        for (let recipe of recipes[i]) {
          let maxAmount = numberOfTeaspoons - recipe.reduce((acc, e) => acc + e, 0);
          let minAmount = i < ingredients.length - 2 ? 0 : maxAmount;
          for (let amount = minAmount; amount <= maxAmount; amount++) {
            let newRecipe = recipe.slice();
            newRecipe.push(amount);
            recipes[recipes.length - 1].push(newRecipe);
          }
        }
      }

      // Find the best recipe
      let resultRecipe = [];
      let resultScore = 0;
      for (let recipe of recipes[recipes.length - 1]) {
        let score = 1;
        score *= Math.max(ingredients.reduce((acc, e, i) => acc + e.capacity * recipe[i], 0), 0);
        score *= Math.max(ingredients.reduce((acc, e, i) => acc + e.durability * recipe[i], 0), 0);
        score *= Math.max(ingredients.reduce((acc, e, i) => acc + e.flavor * recipe[i], 0), 0);
        score *= Math.max(ingredients.reduce((acc, e, i) => acc + e.texture * recipe[i], 0), 0);
        let calories = Math.max(ingredients.reduce((acc, e, i) => acc + e.calories * recipe[i], 0), 0);
        if (score > resultScore && (part == 1 || calories == 500)) {
          resultRecipe = recipe;
          resultScore = score;
        }
      }

      if (visualization) {
        for (let i = 0; i < resultRecipe.length; i++)
          visConsole.addLine(`${ingredients[i].name}: ${resultRecipe[i]} teaspoon${resultRecipe[i] == 1 ? "" : "s"}.`);
        if (part == 2) {
          visConsole.addLine();
          visConsole.addLine("Calories: 500.");
        }
      }
    
      return resultScore;
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
 * Puzzle ingredient class.
 */
class Ingredient  {
  /**
   * @param {string} name Name.
   * @param {number} capacity Capacity.
   * @param {number} durability Durability.
   * @param {number} flavor Flavor.
   * @param {number} texture Texture.
   * @param {number} calories Calories.
   */
  constructor(name, capacity, durability, flavor, texture, calories) {
    /**
     * Name.
     * @type {string}
     */
    this.name = name;
    /**
     * Capacity.
     * @type {number}
     */
    this.capacity = capacity;
    /**
     * Durability.
     * @type {number}
     */
    this.durability = durability;
    /**
     * Flavor.
     * @type {number}
     */
    this.flavor = flavor;
    /**
     * Texture.
     * @type {number}
     */
    this.texture = texture;
    /**
     * Calories.
     * @type {number}
     */
    this.calories = calories;
  }
}