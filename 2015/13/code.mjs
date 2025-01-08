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
   * @returns {Map<string, Map<string, number>} Happiness map.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let map = new Map();
    input.trim().split(/\r?\n/).map((line, index) => {
      let match;
      if ((match = line.match(/^(.+) would (gain|lose) (\d+) happiness units by sitting next to (.+).$/)) == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      if (!map.has(match[1]))
        map.set(match[1], new Map());
      map.get(match[1]).set(match[4], parseInt(match[3]) * (match[2] == "gain" ? 1 : -1));
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds the total change in happiness for the optimal seating arrangement.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Total change in happiness for the optimal seating arrangement.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let happinessMap = this.parse(input);

      if (part == 2) {
        let you = new Map();
        for (let person of happinessMap.keys()) {
          happinessMap.get(person).set("You", 0);
          you.set(person, 0);
        }
        happinessMap.set("You", you);
      }

      let people = [...happinessMap.keys()];

      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      // Find all arrangements
      let arrangements = [[[people[0]]]];
      for (let i = 0; i < people.length - 1; i++) {
        arrangements.push([]);
        for (let arrangement of arrangements[i]) {
          for (let person of people) {
            if (!arrangement.includes(person)) {
              let newArrangement = arrangement.slice();
              newArrangement.push(person);
              arrangements[arrangements.length - 1].push(newArrangement);
            }
          }
        }
      }

      // Find the optimal arrangement
      let resultArrangement = [];
      let resultHappinessChange = Number.MIN_VALUE;
      for (let arrangement of arrangements[people.length - 1]) {
        let happinessChange = 0;
        for (let i = 0; i < arrangement.length; i++) {
          happinessChange += happinessMap.get(arrangement[i]).get(arrangement[(i + 1) % arrangement.length]);
          happinessChange += happinessMap.get(arrangement[i]).get(arrangement[(i - 1 + arrangement.length) % arrangement.length]);
        }
        if (happinessChange > resultHappinessChange) {
          resultArrangement = arrangement;
          resultHappinessChange = happinessChange;
        }
      }

      if (visualization) {
        for (let i = 0; i < resultArrangement.length; i++) {
          let leftHappinessChange = happinessMap.get(resultArrangement[i]).get(resultArrangement[(i - 1 + resultArrangement.length) % resultArrangement.length]);
          let rightHappinessChange = happinessMap.get(resultArrangement[i]).get(resultArrangement[(i + 1) % resultArrangement.length]);
          visConsole.addLine(`${leftHappinessChange > 0 ? "+" : ""}${leftHappinessChange}`);
          visConsole.addLine(resultArrangement[i]);
          visConsole.lines[visConsole.lines.length - 1].classList.add("highlighted");
          visConsole.addLine(`${rightHappinessChange > 0 ? "+" : ""}${rightHappinessChange}`);
        }
      }
    
      return resultHappinessChange;
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