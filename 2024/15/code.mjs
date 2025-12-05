import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

const obstacleColorIndex = 1;
const obstacleColor = "#999999";
const boxColorIndex = 2;
const boxColor = "#00aa00";
const robotColorIndex = 3;
const robotColor = "#ffffff";
const boxLeftColorIndex = 4;
const boxLeftColor = "#00bb00";
const boxRightColorIndex = 5;
const boxRightColor = "#009900";

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
   *  map: number[][],
   *  movements: Vector2D[],
   *  robot: Vector2D
   * }} Map, movements and robot position.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let blocks = input.trim().split(/\r?\n\r?\n/);
  if (blocks.length != 2)
    throw new Error("Input structure is not valid");

  let map = blocks[0].split(/\r?\n/).map((line, index, lines) => {
    if (line.length != lines[0].length)
      throw new Error(`Invalid length of block 1 line ${index + 1}`);
    if (((index == 0 || index == lines.length - 1) && !/^#+$/.test(line)) || !/^#[#\.O@]+#$/.test(line))
      throw new Error(`Invalid data in block 1 line ${index + 1}`);
    return line.split("").map(e => e == "#" ? obstacleColorIndex : (e == "." ? 0 : (e == "O" ? boxColorIndex : robotColorIndex)));
  });

  let movements = blocks[1].replaceAll(/\r?\n/g, "").split("").map((symbol, index) => {
    if (!/^[><v\^]$/.test(symbol))
      throw new Error(`Invalid data in block 2 symbol ${index + 1}`);
    if (symbol == ">")
      return new Vector2D(1, 0);
    if (symbol == "<")
      return new Vector2D(-1, 0);
    if (symbol == "v")
      return new Vector2D(0, 1);
    if (symbol == "^")
      return new Vector2D(0, -1);
  });

  let robots = map.reduce((acc, line, y) => [...acc, ...[...line.keys()].filter(x => line[x] == robotColorIndex).map(x => new Vector2D(x, y))], []);
  if (robots.length == 0)
    throw new Error("Robot not found");
  if (robots.length > 1)
    throw new Error("More than one robot found");
  let robot = robots[0];

  consoleLine.innerHTML += " done.";
  return { map, movements, robot };
}

  /**
   * Calculates the sum of box coordinates.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Sum of box coordinates.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let { map, movements, robot } = this.parse(input);
      
      // Extend the map for part 2
      if (part == 2) {
        map = map.map(line => line.reduce((acc, e) => {
          if (e == obstacleColorIndex)
            acc.push(obstacleColorIndex, obstacleColorIndex)
          if (e == boxColorIndex)
            acc.push(boxLeftColorIndex, boxRightColorIndex)
          if (e == 0)
            acc.push(0, 0)
          if (e == robotColorIndex)
            acc.push(robotColorIndex, 0)
          return acc;
        }, []));
        robot.x *= 2;
      }

      let mapWidth = map[0].length;
      let mapHeight = map.length;

      let solConsole = this.solConsole;
      solConsole.addLine(`Number of movements: ${movements.length}.`);

      let pixelMap = new PixelMap(mapWidth, mapHeight);
 
      if (visualization) {
        pixelMap.palette[obstacleColorIndex] = obstacleColor;
        pixelMap.palette[boxColorIndex] = boxColor;
        pixelMap.palette[robotColorIndex] = robotColor;
        pixelMap.palette[boxLeftColorIndex] = boxLeftColor;
        pixelMap.palette[boxRightColorIndex] = boxRightColor;
  
        this.visContainer.append(pixelMap.container);
      }

      pixelMap.draw(map);
      
      let solConsoleLine = solConsole.addLine();

      for (let movementIndex = 0; movementIndex < movements.length; movementIndex++) {
        if (this.isStopping)
          return;

        let movement = movements[movementIndex];
        let moveIsHorizontal = movement.y == 0;
        
        // Horizontal move
        if (moveIsHorizontal) {
          let y = robot.y;
          let endX = robot.x + movement.x;

          for (; pixelMap.image[y][endX] == boxColorIndex || pixelMap.image[y][endX] == boxLeftColorIndex || pixelMap.image[y][endX] == boxRightColorIndex; endX += movement.x);

          if (pixelMap.image[y][endX] == 0) {
            for (let x = endX; x != robot.x; x -= movement.x) {
              pixelMap.drawPixel(x, y, pixelMap.image[y][x - movement.x]);
              pixelMap.drawPixel(x - movement.x, y, 0);
            }

            robot.add(movement);
          }
        }
        
        // Vertical move
        else {
          let y = robot.y;

          let moveLines = [new Set()];
          moveLines[0].add(robot.x);
          let moveIsPossible = true;

          while (moveIsPossible && moveLines[moveLines.length - 1].size > 0) {
            y += movement.y;
            let newMoveLine = new Set();
            for (let x of moveLines[moveLines.length - 1]) {
              if (pixelMap.image[y][x] == boxColorIndex)
                newMoveLine.add(x);
              if (pixelMap.image[y][x] == obstacleColorIndex)
                moveIsPossible = false;
              if (pixelMap.image[y][x] == boxLeftColorIndex) {
                newMoveLine.add(x);
                newMoveLine.add(x + 1);
              }
              if (pixelMap.image[y][x] == boxRightColorIndex) {
                newMoveLine.add(x);
                newMoveLine.add(x - 1);
              }
            }
            
            moveLines.push(newMoveLine);
          }

          if (moveIsPossible) {
            for (let i = moveLines.length - 1; i >= 0; i--) {
              y = robot.y + movement.y * i;
              for (let x of moveLines[i]) {
                pixelMap.drawPixel(x, y + movement.y, pixelMap.image[y][x]);
                pixelMap.drawPixel(x, y, 0);
              }
            }

            robot.add(movement);
          }
        }

        if (visualization)
          await delay(1);

        solConsoleLine.innerHTML = `Movement ${movementIndex + 1}.`;
      }      
  
      return pixelMap.image.reduce((lineAcc, line, y) => lineAcc + line.reduce((acc, colorIndex, x) => acc + (colorIndex == boxColorIndex || colorIndex == boxLeftColorIndex ? 100 * y + x : 0), 0), 0);
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