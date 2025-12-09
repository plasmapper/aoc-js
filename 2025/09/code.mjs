import { delay, Console, PixelMap, Vector2D, Vector3D } from "../../utility.mjs";

const redTileColorIndex = 1;
const redTileColor = "#ff0000";
const greenTileColorIndex = 2;
const greenTileColor = "#00aa00";
const rectangleColorIndex = 3;
const rectangleColor = "#ffffff";
const outsideColorIndex = 4;
const outsideColor = "#000000";

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
   * @returns {Vector2D[]} Red tiles.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let startPoistion;
    let redTiles = input.trim().split(/\r?\n/).map((line, index, lines) => {
      let match = line.match(/^(\d+),(\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return new Vector2D(parseInt(match[1]), parseInt(match[2]));
    });

    consoleLine.innerHTML += " done.";
    return redTiles;
  }

  /**
   * Finds the largest area of the rectangle with red tiles as opposite corners (part 1) or the largest area of the rectangle that contains only red and green tiles (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Largest area of the rectangle with red tiles as opposite corners (part 1) or the largest area of the rectangle that contains only red and green tiles (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let redTiles = this.parse(input);

      if (redTiles.length < 4)
        throw new Error("The number of tiles is too small");

      for (let i = 0; i < redTiles.length; i++) {
        let tile1 = redTiles[i];
        let tile2 = redTiles[(i + 1) % redTiles.length];
        if (!((tile1.x == tile2.x) ^ ((tile1.y == tile2.y))))
          throw new Error("Consequtive tile positions should have different X or Y coordinates but not both");
      }

      let largestArea = 0;
      let largestAreaTileIndexes = [0, 0];
      for (let tile1Index = 0; tile1Index < redTiles.length; tile1Index++) {
        for (let tile2Index = tile1Index + 1; tile2Index < redTiles.length; tile2Index++) {
          // Find the area of the rectangle
          let rectX1 = redTiles[tile1Index].x, rectY1 = redTiles[tile1Index].y, rectX2 = redTiles[tile2Index].x, rectY2 = redTiles[tile2Index].y;
          let area = (Math.abs(rectX1 - rectX2) + 1) * (Math.abs(rectY1 - rectY2) + 1);

          // Check if the area is larger than the previously found one
          if (area > largestArea) {
            if (part == 1) {
              largestArea = area;
              largestAreaTileIndexes = [tile1Index, tile2Index];
            }
            // For part 2 check that the edges do not cross the rectangle
            if (part == 2) {
              [rectX1, rectX2] = [Math.min(rectX1, rectX2), Math.max(rectX1, rectX2)];
              [rectY1, rectY2] = [Math.min(rectY1, rectY2), Math.max(rectY1, rectY2)];
              let edgesDoNotCrossRectangle = true;
              for (let edgeIndex = 0; edgeIndex < redTiles.length && edgesDoNotCrossRectangle; edgeIndex++) {
                let edgeX1 = redTiles[edgeIndex].x, edgeY1 = redTiles[edgeIndex].y;
                let egdeX2 = redTiles[(edgeIndex + 1) % redTiles.length].x, edgeY2 = redTiles[(edgeIndex + 1) % redTiles.length].y;
                if (edgeX1 == egdeX2 && edgeX1 > rectX1 && edgeX1 < rectX2)
                  edgesDoNotCrossRectangle = (edgeY1 <= rectY1 && edgeY2 <= rectY1) || (edgeY1 >= rectY2 && edgeY2 >= rectY2);
                if (edgeY1 == edgeY2 && edgeY1 > rectY1 && edgeY1 < rectY2)
                  edgesDoNotCrossRectangle = (edgeX1 <= rectX1 && egdeX2 <= rectX1) || (edgeX1 >= rectX2 && egdeX2 >= rectX2);
              }
              // Check if the middle of the rectangle is inside the tile pattern (to differentiate the whole rectangle being inside from the whole rectangle being outside)
              if (edgesDoNotCrossRectangle) {
                let rectMiddle = new Vector2D((rectX2 + rectX1) / 2, (rectY2 + rectY1) / 2);
                let sumOfAngles = 0;
                for (let tileIndex = 0; tileIndex < redTiles.length; tileIndex++) {
                  let vector1 = redTiles[tileIndex].clone().subtract(rectMiddle);
                  let vector2 = redTiles[(tileIndex + 1) % redTiles.length].clone().subtract(rectMiddle);
                  vector1 = new Vector3D(vector1.x, vector1.y, 0);
                  vector2 = new Vector3D(vector2.x, vector2.y, 0);
                  let cross = vector1.cross(vector2).z;
                  let vector1Abs = vector1.abs();
                  let vector2Abs = vector2.abs();
                  if (cross && vector1Abs && vector2Abs) {
                    let asin = Math.asin(Math.max(-1, Math.min(1, cross / vector1Abs / vector2Abs)));
                    let cos = vector1.dot(vector2) / vector1Abs / vector2Abs;
                    if (cos >= 0)
                      sumOfAngles += asin;
                    else {
                      sumOfAngles += (asin >= 0 ? Math.PI - asin : -Math.PI - asin);
                    }
                  }
                }

                if (Math.abs(sumOfAngles) > 1) {
                  largestArea = area;
                  largestAreaTileIndexes = [tile1Index, tile2Index];
                }
              }
            }
          }
        }
      }

      if (visualization) {
        let mapMax = redTiles.reduce((acc, e) => new Vector2D(Math.max(acc.x, e.x), Math.max(acc.y, e.y)), new Vector2D(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER));
        let mapScale = Math.ceil(Math.max(mapMax.x, mapMax.y) / 500);
        let mapWidth = Math.floor(mapMax.x / mapScale) + 3;
        let mapHeight = Math.floor(mapMax.y / mapScale) + 3;

        let pixelMap = new PixelMap(mapWidth, mapHeight);
        this.visContainer.append(pixelMap.container);
        pixelMap.palette[redTileColorIndex] = redTileColor;
        pixelMap.palette[greenTileColorIndex] = greenTileColor;
        pixelMap.palette[rectangleColorIndex] = rectangleColor;
        pixelMap.palette[outsideColorIndex] = outsideColor;

        for (let i = 0; i < redTiles.length; i++) {
          let tile1 = new Vector2D(Math.floor(redTiles[i].x / mapScale) + 1, Math.floor(redTiles[i].y / mapScale) + 1);
          // Draw red tiles
          pixelMap.drawPixel(tile1.x, tile1.y, redTileColorIndex);
          
          // Draw green tile edges
          if (part == 2) {
            let tile2 = new Vector2D(Math.floor(redTiles[(i + 1) % redTiles.length].x / mapScale) + 1, Math.floor(redTiles[(i + 1) % redTiles.length].y / mapScale) + 1);
            let direction = tile2.clone().subtract(tile1);
            let distance = Math.abs(direction.y == 0 ? direction.x : direction.y);
            direction.x = direction.x == 0 ? direction.x : direction.x / Math.abs(direction.x);
            direction.y = direction.y == 0 ? direction.y : direction.y / Math.abs(direction.y);
            for (let j = 1, position = tile1.clone().add(direction); j < distance; j++, position.add(direction))
              pixelMap.drawPixel(position.x, position.y, greenTileColorIndex);
          }
        }

        // Fill inner green tiles
        if (part == 2) {
          pixelMap.fill(0, 0, outsideColorIndex);
          for (let x = 0; x < pixelMap.width; x++) {
            for (let y = 0; y < pixelMap.height; y++) {
              if (pixelMap.image[y][x] == 0)
                pixelMap.drawPixel(x, y, greenTileColorIndex);
            }
          }
        }

        // Draw rectangle
        let tile1 = new Vector2D(Math.floor(redTiles[largestAreaTileIndexes[0]].x / mapScale) + 1, Math.floor(redTiles[largestAreaTileIndexes[0]].y / mapScale) + 1);
        let tile2 = new Vector2D(Math.floor(redTiles[largestAreaTileIndexes[1]].x / mapScale) + 1, Math.floor(redTiles[largestAreaTileIndexes[1]].y / mapScale) + 1);
        let [x1, x2] = [Math.min(tile1.x, tile2.x), Math.max(tile1.x, tile2.x)];
        let [y1, y2] = [Math.min(tile1.y, tile2.y), Math.max(tile1.y, tile2.y)];
        for (let x = x1; x <= x2; x++) {
          for (let y = y1; y <= y2; y++)
            pixelMap.drawPixel(x, y, rectangleColorIndex);
        }
      }

      return largestArea;
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