import { delay, Console, PixelMap, Renderer, RendererColor, RendererCuboid, Vector3D, Vector2D } from "../../utility.mjs";

const fieldColorIndex = 1;
const fieldColor = "#00aa00";
const fieldColor3D = new RendererColor(0, 0.66, 0, 1);
const obstacleColorIndex = 2;
const obstacleColor = "#ffffff";
const obstacleColor3D = new RendererColor(1, 1, 1, 1);
const positionColorIndex = 3;
const positionColor = "#ffff00";
const positionColor3D = new RendererColor(1, 1, 0, 1);

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
   *  movements: string[],
   * }} Map and movements.
   */
 parse(input) {
  let consoleLine = this.solConsole.addLine("Parsing...");

  let blocks = input.split(/\r?\n\r?\n/);
  if (blocks.length != 2)
    throw new Error("Input structure is not valid");

  let map = blocks[0].split(/\r?\n/).map((line, lineIndex, lines) => {
    if (!/^[\s\.#]+$/.test(line))
      throw new Error(`Invalid data in block 1 line ${lineIndex + 1}`);
    return line.split("").map(e => e == "#" ? obstacleColorIndex : (e == "." ? fieldColorIndex : 0));
  });

  let mapWidth = map.reduce((acc, line) => Math.max(acc, line.length), 0);
  map.forEach(line => line.push(...new Array(mapWidth - line.length).fill(0)));

  let movementString = blocks[1].trim();
  if (!/^[\dRL]+$/.test(movementString))
    throw new Error(`Invalid data in block 2`);
  
  let movements = [];
  let distanceStart = 0;
  for (let i = 0; i < movementString.length; i++) {
    if (movementString[i] == "R" || movementString[i] == "L") {
      if (distanceStart < i)
        movements.push(movementString.substring(distanceStart, i));
      movements.push(movementString[i]);
      distanceStart = i + 1;      
    }
  }
  if (distanceStart < movementString.length)
    movements.push(movementString.substring(distanceStart));

  consoleLine.innerHTML += " done.";
  return { map, movements };
}

  /**
   * Finds the map-based password.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Map-based password.
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let { map, movements } = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;

      let cubeSize = Math.sqrt(map.reduce((acc, line) => acc + line.reduce((lineAcc, e) => lineAcc + (e != 0 ? 1 : 0), 0), 0) / 6);

      let startX = map[0].indexOf(fieldColorIndex);
      if (startX < 0)
        throw new Error("Valid start position not found");
      let position = new Vector3D(startX, 0, 0);

      let direction = new Vector3D(1, 0, 0);
      let normal = new Vector3D(0, 0, -1);

      // Prepare data for part 2
      let cubeCenter = new Vector3D(cubeSize / 2, cubeSize / 2, cubeSize / 2);
      let cornerMapWidth, cornerMapHeight;
      let cornerMap = [];
      let obstacles = [];
      let obstacleMap3D = [];

      if (part == 2) {
        if (mapWidth % cubeSize != 0 && mapHeight % cubeSize != 0)
          throw new Error("Map dimensions are invalid for a 3D cube")
        cornerMapWidth = mapWidth / cubeSize;
        cornerMapHeight = mapHeight / cubeSize;
  
        // Find 3D positions, directions and normals for 2D map corners
        let startCx = position.x / cubeSize;
        cornerMap.push(new Array(cornerMapWidth).fill(null));
        cornerMap[0][startCx] = new Corner3D(new Vector3D(0, 0, 0), new Vector3D(0, 0, -1), new Vector3D(1, 0, 0), new Vector3D(0, 1, 0));

        for (let cy = 0; cy < cornerMapHeight; cy++) {
          if (cy != 0) {
            cornerMap.push(new Array(cornerMapWidth).fill(null));
            for (startCx = 0; startCx < cornerMapWidth && (map[cy * cubeSize][startCx * cubeSize] == 0 || cornerMap[cy - 1][startCx] == null); startCx++);

            cornerMap[cy][startCx] = new Corner3D(
              cornerMap[cy - 1][startCx].position.clone().add(cornerMap[cy - 1][startCx].yDirection.clone().multiply(cubeSize - 1)),
              cornerMap[cy - 1][startCx].yDirection,
              cornerMap[cy - 1][startCx].xDirection,
              cornerMap[cy - 1][startCx].normal.clone().multiply(-1)
            );
          }

          for (let cx = startCx + 1; cx < cornerMapWidth; cx++) {
            if (map[cy * cubeSize][cx * cubeSize] != 0) 
              cornerMap[cy][cx] = new Corner3D(
                cornerMap[cy][cx - 1].position.clone().add(cornerMap[cy][cx - 1].xDirection.clone().multiply(cubeSize - 1)),
                cornerMap[cy][cx - 1].xDirection,
                cornerMap[cy][cx - 1].normal.clone().multiply(-1),
                cornerMap[cy][cx - 1].yDirection
              );
          }
          for (let cx = startCx - 1; cx >= 0; cx--) {
            if (map[cy * cubeSize][cx * cubeSize] != 0) 
              cornerMap[cy][cx] = new Corner3D(
                cornerMap[cy][cx + 1].position.clone().subtract(cornerMap[cy][cx + 1].normal.clone().multiply(cubeSize - 1)),
                cornerMap[cy][cx + 1].xDirection.clone().multiply(-1),
                cornerMap[cy][cx + 1].normal.clone(),
                cornerMap[cy][cx + 1].yDirection
              );
          }
        }

        // Find 3D positions of obstacles
        for (let z = 0; z < cubeSize + 2; z++) {
          obstacleMap3D.push([]);
          for (let y = 0; y < cubeSize + 2; y++) {
            obstacleMap3D[obstacleMap3D.length - 1].push([])
            for (let x = 0; x < cubeSize + 2; x++)
              obstacleMap3D[obstacleMap3D.length - 1][obstacleMap3D[obstacleMap3D.length - 1].length - 1].push(0);
          }
        }

        for (let y = 0; y < mapHeight; y++) {
          for (let x = 0; x < mapWidth; x++) {
            if (map[y][x] == obstacleColorIndex) {
              let corner = cornerMap[Math.floor(y / cubeSize)][Math.floor(x / cubeSize)];
              let obstacle = corner.position.clone().add(corner.xDirection.clone().multiply(x % cubeSize)).add(corner.yDirection.clone().multiply(y % cubeSize)).add(corner.normal);
              obstacles.push(obstacle);
              obstacleMap3D[obstacle.z + 1][obstacle.y + 1][obstacle.x + 1] = 1;
            }
          }
        }

        // Set initial 3D position
        position.x = 0;
      }

      let solConsole = this.solConsole;
      solConsole.addLine(`Number of movements: ${movements.length}.`);

      let pixelMap = new PixelMap(mapWidth, mapHeight);
      let renderer = new Renderer();
      let positionCube = new RendererCuboid(1, 1, 1, positionColor3D);
      
      if (visualization) {
        if (part == 1) {
          pixelMap.palette[fieldColorIndex] = fieldColor;
          pixelMap.palette[obstacleColorIndex] = obstacleColor;
          pixelMap.palette[positionColorIndex] = positionColor;
    
          this.visContainer.append(pixelMap.container);
          pixelMap.draw(map);
        }
        else {
          this.visContainer.append(renderer.container);

          renderer.addObject(new RendererCuboid(cubeSize, cubeSize, cubeSize, fieldColor3D));
          for (let obstacleOrigin of obstacles) {
            let obstacleCube = new RendererCuboid(1, 1, 1, obstacleColor3D);
            obstacleCube.origin = obstacleOrigin;
            renderer.addObject(obstacleCube);
          }

          renderer.addObject(positionCube);
          renderer.render();
        }
      }

      let solConsoleLine = solConsole.addLine();
      
      for (let movementIndex = 0; movementIndex < movements.length; movementIndex++) {
        if (this.isStopping)
          return;

        let movement = movements[movementIndex];

        // Turn right
        if (movement == "R")
          direction = direction.clone().cross(normal);
        // Turn left
        else if (movement == "L")
          direction = normal.clone().cross(direction);
        // Move forward
        else {
          let distance = parseInt(movement);
          let stop = false;
          for (let i = 0; i < distance && !stop; i++) {
            let newPos = position.clone().add(direction);
            let newDir = direction.clone();
            let newNorm = normal.clone();

            // Move forward 2D
            if (part == 1) {
              if (newPos.x < 0 || newPos.x >= mapWidth || newPos.y < 0 || newPos.y >= mapHeight || map[newPos.y][newPos.x] == 0) {
                for (newPos.subtract(direction); newPos.x >= 0 && newPos.x < mapWidth && newPos.y >= 0 && newPos.y < mapHeight && map[newPos.y][newPos.x] != 0; newPos.subtract(direction));
                newPos.add(direction);
              }
  
              stop = map[newPos.y][newPos.x] == obstacleColorIndex;
            }
            // Move forward 3D
            else {
              if (newPos.x < 0 || newPos.x >= cubeSize || newPos.y < 0 || newPos.y >= cubeSize || newPos.z < 0 || newPos.z >= cubeSize) {
                newPos.subtract(direction);
                newDir = normal.clone().multiply(-1);
                newNorm = direction.clone();
              }

              stop = obstacleMap3D[newPos.z + newNorm.z + 1][newPos.y + newNorm.y + 1][newPos.x + newNorm.x + 1] != 0;
            }            

            if (!stop) {
              if (visualization) {
                if (part == 1) {
                  pixelMap.drawPixel(position.x, position.y, fieldColorIndex);
                  pixelMap.drawPixel(newPos.x, newPos.y, positionColorIndex);
                }
                else {
                  positionCube.origin = newPos.clone().add(newNorm);
                  renderer.cameraTarget = positionCube.origin;
                  renderer.cameraPosition = cubeCenter.clone().add(positionCube.origin.clone().subtract(cubeCenter).normalize().multiply(cubeSize * 3));
                  let cameraDirectionNormal = renderer.cameraPosition.clone().subtract(renderer.cameraTarget).normalize();
                  renderer.cameraUpDirection.subtract(cameraDirectionNormal.multiply(renderer.cameraUpDirection.dot(cameraDirectionNormal))).normalize();
                  renderer.render();
                }
                await delay(1);
              }

              position = newPos;
              direction = newDir;
              normal = newNorm;
            }
          }
        }

        solConsoleLine.innerHTML = `Movement ${movementIndex + 1}.`;
      }

      if (part == 1)
        return (position.y + 1) * 1000 + (position.x + 1) * 4 + (direction.x != 0 ? 1 - direction.x : 0) + (direction.y != 0 ? 2 - direction.y : 0);

      // Find the 2D position and direction corresponding to the 3D position and direction
      let position2D = null, direction2D = null;
      for (let cy = 0; cy < cornerMapHeight; cy++) {
        for (let cx = 0; cx < cornerMapWidth; cx++) {
          let corner = cornerMap[cy][cx];
          if (corner != null && corner.normal.equals(normal)) {
            position2D = new Vector2D(
              cx * cubeSize + position.clone().subtract(corner.position).dot(corner.xDirection),
              cy * cubeSize + position.clone().subtract(corner.position).dot(corner.yDirection)
            );
            direction2D = new Vector2D(
              direction.clone().dot(corner.xDirection),
              direction.clone().dot(corner.yDirection)
            );
           }
        }
      }

      if (position2D == null || direction2D == null)
        throw new Error("2D position and direction corresponding to the 3D position and direction not found");
      return (position2D.y + 1) * 1000 + (position2D.x + 1) * 4 + (direction2D.x != 0 ? 1 - direction2D.x : 0) + (direction2D.y != 0 ? 2 - direction2D.y : 0);
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
 * Puzzle 3D corner class.
 */
class Corner3D {
  /**
   * @param {Vector3D} position Position.
   * @param {Vector3D} normal Normal.
   * @param {Vector3D} xDirection 2D map X direction.
   * @param {Vector3D} yDirection 2D map Y direction.
   */
  constructor(position, normal, xDirection, yDirection) {
    /**
     * Position.
     * @type {Vector3D}
     */    
    this.position = position;
    /**
     * Normal.
     * @type {Vector3D}
     */    
    this.normal = normal;
    /**
     * 2D map X direction.
     * @type {Vector3D}
     */    
    this.xDirection = xDirection;
    /**
     * 2D map Y direction.
     * @type {Vector3D}
     */    
    this.yDirection = yDirection;
  }
}