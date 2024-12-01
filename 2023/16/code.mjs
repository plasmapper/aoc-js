import { delay, Console, PixelMap, Vector2D } from "../../utility.mjs";

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
   * @returns {MapTile[][]} Map.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let map = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      if (!/^[\.\|\\/\-]+$/.test(line))
        throw new Error(`Invalid data in line ${index + 1}`);
      
      if (index != 0 && line.length != map[0].length)
        throw new Error(`Invalid length of line ${index + 1}`);

      map.push(line.split("").map(e => new MapTile(e)));
    });

    consoleLine.innerHTML += " done.";
    return map;
  }

  /**
   * Finds the number of energized map tiles.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of energized map tiles.
   */
  async solve(part, input, visualization) {
    const mirrorColorIndex = 1;
    const mirrorColor = "#00aa00";
    const lightColorIndex = 2;
    const lightColor = "#ffffff";
    const beamColorIndex = 3;
    const beamColor = "#ff0000";
    const tileSize = 5;
    const tileCenter = Math.floor(tileSize / 2);

    try {
      this.isSolving = true;

      let map = this.parse(input);
      let mapWidth = map[0].length;
      let mapHeight = map.length;

      let solConsole = this.solConsole;
      solConsole.addLine(`Map width: ${mapWidth}. Map height: ${mapHeight}.`);

      let pixelMap = new PixelMap(mapWidth * tileSize, mapHeight * tileSize);
      
      if (visualization) {
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[mirrorColorIndex] = mirrorColor;
        pixelMap.palette[lightColorIndex] = lightColor;
        pixelMap.palette[beamColorIndex] = beamColor;
      }

      let initialBeams = [];
      
      if (part == 1)
        initialBeams = [new Beam(new Vector2D(0, 0), new Vector2D(1, 0))];
      else {
        for (let x = 0; x < mapWidth; x++) {
          initialBeams.push(new Beam(new Vector2D(x, 0), new Vector2D(0, 1)));
          initialBeams.push(new Beam(new Vector2D(x, mapHeight - 1), new Vector2D(0, -1)));
        }
        for (let y = 0; y < mapHeight; y++) {
          initialBeams.push(new Beam(new Vector2D(0, y), new Vector2D(1, 0)));
          initialBeams.push(new Beam(new Vector2D(mapWidth - 1, y), new Vector2D(-1, 0)));
        }
      }

      let maxNumberOfEnergizedTiles = 0;
      let initialBeamWithMaxNumberOfEnergizedTiles;

      for (let v = 0; v == 0 || (visualization && v <= 1); v++) {
        let visualizationCycle = v > 0;
        if (visualizationCycle)
          initialBeams = [initialBeamWithMaxNumberOfEnergizedTiles];

        for (let initialBeam of initialBeams) {
          map.forEach(line => line.forEach(tile => tile.beamDirections = []));
          
          // Visualize the mirror map
          if (visualizationCycle) {
            for (let y = 0; y < mapHeight; y++) {
              for (let x = 0; x < mapWidth; x++) {
                switch (map[y][x].mirror) {
                  case "-":
                    for (let i = 0; i < tileSize; i++)
                      pixelMap.drawPixel(x * tileSize + i, y * tileSize + tileCenter, mirrorColorIndex);
                    break;
                  case "|":
                    for (let i = 0; i < tileSize; i++)
                      pixelMap.drawPixel(x * tileSize + tileCenter, y * tileSize + i, mirrorColorIndex);
                    break;
                  case "/":
                    for (let i = 0; i < tileSize; i++)
                      pixelMap.drawPixel((x + 1) * tileSize - i - 1, y * tileSize + i, mirrorColorIndex);
                    break;
                  case "\\":
                    for (let i = 0; i < tileSize; i++)
                      pixelMap.drawPixel(x * tileSize + i, y * tileSize + i, mirrorColorIndex);
                    break;
                }
              }
            }
          }
          
          for (let beams = [initialBeam]; beams.length > 0; ) {
            if (this.isStopping)
              return;

            // Visualize current beams
            if (visualizationCycle) {
              let beamImagePaths = [];
              for (let beam of beams) {
                let mirror = map[beam.location.y][beam.location.x].mirror;
                beamImagePaths.push([]);
                let beamImagePath = beamImagePaths[beamImagePaths.length - 1];

                beamImagePath[0] = beam.location.clone().multiply(tileSize);
                if (beam.direction.x == 0)
                beamImagePath[0].x += tileCenter;
                if (beam.direction.x < 0)
                  beamImagePath[0].x += tileSize - 1;
                if (beam.direction.y == 0)
                  beamImagePath[0].y += tileCenter;
                if (beam.direction.y < 0)
                  beamImagePath[0].y += tileSize - 1;

                for (let i = 1; i < tileSize; i++)
                  beamImagePath.push(beamImagePath[beamImagePath.length - 1].clone().add(beam.direction));

                if ((mirror == "-" && beam.direction.x == 0) || (mirror == "|" && beam.direction.y == 0)) {
                  for (let i = tileCenter; i < tileSize; i++)
                    beamImagePath[i] = beamImagePath[tileCenter];
                }
                if (mirror == "/") {
                  for (let i = tileCenter + 1; i < tileSize; i++)
                    beamImagePath[i] = beamImagePath[tileCenter].clone().add(new Vector2D(-beam.direction.y, -beam.direction.x).multiply(i - tileCenter));
                }
                if (mirror == "\\") {
                  for (let i = tileCenter + 1; i < tileSize; i++)
                    beamImagePath[i] = beamImagePath[tileCenter].clone().add(new Vector2D(beam.direction.y, beam.direction.x).multiply(i - tileCenter));
                }
              }

              for (let i = 0; i <= tileSize; i++) {
                for (let beamImagePath of beamImagePaths) {
                  if (i < tileSize && pixelMap.image[beamImagePath[i].y][beamImagePath[i].x] != mirrorColorIndex)
                    pixelMap.drawPixel(beamImagePath[i].x, beamImagePath[i].y, beamColorIndex);
                  if (i > 0 && pixelMap.image[beamImagePath[i - 1].y][beamImagePath[i - 1].x] != mirrorColorIndex)
                    pixelMap.drawPixel(beamImagePath[i - 1].x, beamImagePath[i - 1].y, lightColorIndex);
                }

                if (i < tileSize)
                  await delay(1);
              }
            }

            // Create new beams            
            let newBeams = [];
            for (let beam of beams) {
              map[beam.location.y][beam.location.x].beamDirections.push(beam.direction.clone());
    
              switch(map[beam.location.y][beam.location.x].mirror) {
                case ".":
                  newBeams.push(new Beam(beam.location.clone().add(beam.direction), beam.direction.clone()));
                  break;
                case "-":
                  if (beam.direction.y == 0)
                    newBeams.push(new Beam(beam.location.clone().add(beam.direction), beam.direction.clone()));
                  else {
                    newBeams.push(new Beam(beam.location.clone().add(new Vector2D(1, 0)), new Vector2D(1, 0)));
                    newBeams.push(new Beam(beam.location.clone().add(new Vector2D(-1, 0)), new Vector2D(-1, 0)));
                  }
                  break;
                case "|":
                  if (beam.direction.x == 0)
                    newBeams.push(new Beam(beam.location.clone().add(beam.direction), beam.direction.clone()));
                  else {
                    newBeams.push(new Beam(beam.location.clone().add(new Vector2D(0, 1)), new Vector2D(0, 1)));
                    newBeams.push(new Beam(beam.location.clone().add(new Vector2D(0, -1)), new Vector2D(0, -1)));
                  }
                  break;
                case "/":
                  newBeams.push(new Beam(beam.location.clone().add(new Vector2D(-beam.direction.y, -beam.direction.x)), new Vector2D(-beam.direction.y, -beam.direction.x)));
                  break;
                case "\\":
                  newBeams.push(new Beam(beam.location.clone().add(new Vector2D(beam.direction.y, beam.direction.x)), new Vector2D(beam.direction.y, beam.direction.x)));
                  break;
              }
              newBeams.push();
            }
           
            beams = newBeams.filter(beam => beam.location.x >= 0 && beam.location.x < mapWidth && beam.location.y >= 0 && beam.location.y < mapHeight
              && map[beam.location.y][beam.location.x].beamDirections.find(dir => dir.equals(beam.direction)) == undefined);
          }

          let numberOfEnergizedTiles = map.reduce((accY, line) => accY + line.reduce((accX, e) => accX + (e.beamDirections.length > 0 ? 1 : 0), 0), 0);
          if (numberOfEnergizedTiles > maxNumberOfEnergizedTiles) {
            initialBeamWithMaxNumberOfEnergizedTiles = initialBeam;
            maxNumberOfEnergizedTiles = numberOfEnergizedTiles;
          }
        }
      }

      return maxNumberOfEnergizedTiles;
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
 * Puzzle map tile class.
 */
class MapTile {
  /**
   * @param {string} mirror Mirror or empty space (. | - / \).
   */
  constructor(mirror) {
    /**
     * Mirror or empty space (. | - / \).
     * @type {string}
     */
    this.mirror = mirror;
    /**
     * Directions of the beams that have already entered the tile.
     * @type {Vector2D[]}
     */
    this.beamDirections = [];
  }
}

/**
 * Puzzle beam class.
 */
class Beam {
  /**
   * @param {Vector2D} location Beam location.
   * @param {Vector2D} direction Beam direction.
   */
  constructor(location, direction) {
    /**
     * Beam location.
     * @type {Vector2D}
     */
    this.location = location;
    /**
     * Beam direction.
     * @type {Vector2D}
     */
    this.direction = direction;
  }
}