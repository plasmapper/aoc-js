import { delay, Console, PixelMap, Vector2D, Range2D } from "../../utility.mjs";

const houseColorIndex = 1;
const houseColor = "#00aa00";
const santaColorIndex = 2;
const santaColor = "#ffff00";
const robotColorIndex = 3;
const robotColor = "#ffffff";

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
   * @returns {string} Instructions.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let instructions = input.trim();
    if (!/^[\>\<\^v]+$/.test(instructions))
      throw new Error("Invalid input data");

    consoleLine.innerHTML += " done.";
    return instructions;
  }

  /**
   * Finds the number of houses that receive at least one present.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of houses that receive at least one present.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let instructions = this.parse(input);

      let houseSet = new Set(["0|0"]);
      let houses = [new Vector2D(0, 0)];
      let positions = [new Vector2D(0, 0), new Vector2D(0, 0)];
      for (let i = 0; i < instructions.length; i++) {
        let instruction = instructions[i];
        // Select Santa or robot position
        let position = positions[part == 1 ? 0 : i % 2];
        // Move
        if (instruction == ">")
          position.x++;
        if (instruction == "<")
          position.x--;
        if (instruction == "v")
          position.y++;
        if (instruction == "^")
          position.y--;
        // Add house to the set to count unique houses
        houseSet.add(`${position.x}|${position.y}`)
        // Add house to the array for visualization
        houses.push(position.clone());
      }

      if (visualization) {
        let solConsole = this.solConsole;
        solConsole.addLine(`Number of steps: ${instructions.length}.`);
        let solConsoleLine = solConsole.addLine();

        let mapCoordinateRange = new Range2D(Number.MAX_VALUE, Number.MIN_VALUE, Number.MAX_VALUE, Number.MIN_VALUE);
        for (let house of houses) {
          mapCoordinateRange.x.from = Math.min(mapCoordinateRange.x.from, house.x);
          mapCoordinateRange.x.to = Math.max(mapCoordinateRange.x.to, house.x);
          mapCoordinateRange.y.from = Math.min(mapCoordinateRange.y.from, house.y);
          mapCoordinateRange.y.to = Math.max(mapCoordinateRange.y.to, house.y);
        }

        let pixelMap = new PixelMap(mapCoordinateRange.x.to - mapCoordinateRange.x.from + 1, mapCoordinateRange.y.to - mapCoordinateRange.y.from + 1);
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[houseColorIndex] = houseColor;
        pixelMap.palette[santaColorIndex] = santaColor;
        pixelMap.palette[robotColorIndex] = robotColor;

        let santa = new Vector2D(-mapCoordinateRange.x.from, -mapCoordinateRange.y.from);
        let robot = new Vector2D(-mapCoordinateRange.x.from, -mapCoordinateRange.y.from);

        for (let i = 0; i < houses.length; i++) {
          if (this.isStopping)
            return;

          let house = houses[i];
          house.x -= mapCoordinateRange.x.from;
          house.y -= mapCoordinateRange.y.from;

          if (part == 2)
            pixelMap.drawPixel(robot.x, robot.y, houseColorIndex);
          pixelMap.drawPixel(santa.x, santa.y, houseColorIndex);

          if (part == 1 || i % 2 == 1)
            santa = house;
          else
            robot = house;
  
          if (part == 2)
            pixelMap.drawPixel(robot.x, robot.y, robotColorIndex);
          pixelMap.drawPixel(santa.x, santa.y, santaColorIndex);

          solConsoleLine.innerHTML = `Step: ${i}.`;

          await delay(1);
        }
      }

      return houseSet.size;
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