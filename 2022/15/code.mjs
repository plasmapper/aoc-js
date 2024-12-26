import { delay, Console, Range, Vector2D, LineSegment2D } from "../../utility.mjs";

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
   * @returns {Sensor[]} Sensors.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let sensors = input.trim().split(/\r?\n/).map((line, index) => {
      let match = line.match(/^Sensor at x=(-?\d+), y=(-?\d+): closest beacon is at x=(-?\d+), y=(-?\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return new Sensor(new Vector2D(parseInt(match[1]), parseInt(match[2])), new Vector2D(parseInt(match[3]), parseInt(match[4])));
    });

    consoleLine.innerHTML += " done.";
    return sensors;
  }

  /**
   * Calculates the number of positions that cannot contain a beacon (part 1) or the tuning frequency (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} The number of positions that cannot contain a beacon (part 1) or the tuning frequency (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let sensors = this.parse(input);
      let beaconPositions = sensors.reduce((acc, sensor) => {
        if (acc.find(beacon => beacon.x == sensor.closestBeaconPosition.x && beacon.y == sensor.closestBeaconPosition.y) === undefined)
          acc.push(sensor.closestBeaconPosition);
        return acc;
      }, []);

      let maxSensorX = sensors.reduce((acc, e) => Math.max(acc, e.position.x), 0);
      let part1Row = maxSensorX < 100 ? 10 : 2000000;

      let solConsole = this.solConsole;
      let visConsole = new Console();
      if (visualization && part == 1)
        this.visContainer.append(visConsole.container);

      // Find the number of positions that cannot contain a beacon (part 1)
      if (part == 1) {
        // Find X ranges for all sensors at the specified Y
        let xRanges = [];
        for (let [sensorIndex, sensor] of sensors.entries()) {
          let yDistance = Math.abs(part1Row - sensor.position.y);
          if (yDistance <= sensor.range) {
            xRanges.push(new Range(sensor.position.x - (sensor.range - yDistance), sensor.position.x + (sensor.range - yDistance)));
            if (visualization) {
              visConsole.addLine(`Sensor ${sensorIndex + 1} covers x = ${xRanges[xRanges.length - 1].from}..${xRanges[xRanges.length - 1].to}.`);
              visConsole.addLine();
            }
          }
        }
        
        // Sort ranges by "from" coordinate, combine overlapping ranges and calculate the number of covered positions excluding beacons
        return xRanges.sort((range1, range2) => range1.from != range2.from ? range1.from - range2.from : range1.to - range2.to).reduce((acc, range) => {
          let lastRange = acc[acc.length - 1];
          if (range.from <= lastRange.to + 1)
            lastRange.to = Math.max(lastRange.to, range.to);
          else
            acc.push(range);
          return acc;
        }, [xRanges[0]]).reduce((acc, range) => {
          let rangeSize = range.to - range.from + 1;
          for (let beaconPosition of beaconPositions) {
            if (beaconPosition.y == part1Row && beaconPosition.x >= range.from && beaconPosition.x <= range.to)
              rangeSize--;
          }
          return acc + rangeSize;
        }, 0);
      }
      // Find the tuning frequency (part 2)
      else {
        // Find two pairs of sensors with a pair having sensor areas separated by 1 empty line gap and find the gap intersection.
        for (let i1 = 0; i1 < sensors.length; i1++) {
          for (let i2 = i1 + 1; i2 < sensors.length; i2++) {
            if (sensors[i1].position.clone().subtract(sensors[i2].position).manhattanLength() - sensors[i1].range - sensors[i2].range == 2) {
              let sensor12Vector = sensors[i2].position.clone().subtract(sensors[i1].position);
              let gap1 = new LineSegment2D(
                new Vector2D(sensors[i1].position.x + (sensors[i1].range + 1) * Math.sign(sensor12Vector.x), sensors[i1].position.y),
                new Vector2D(sensors[i1].position.x, sensors[i1].position.y + (sensors[i1].range + 1) * Math.sign(sensor12Vector.y))
              );

              for (let i3 = i1 + 1; i3 < sensors.length; i3++) {
                for (let i4 = i3 + 1; i4 < sensors.length; i4++) {
                  if (i3 != i2 && i4 != i2 && sensors[i3].position.clone().subtract(sensors[i4].position).manhattanLength() - sensors[i3].range - sensors[i4].range == 2) {
                    let sensor34Vector = sensors[i4].position.clone().subtract(sensors[i3].position);
                    let gap2 = new LineSegment2D(
                      new Vector2D(sensors[i3].position.x + (sensors[i3].range + 1) * Math.sign(sensor34Vector.x), sensors[i3].position.y),
                      new Vector2D(sensors[i3].position.x, sensors[i3].position.y + (sensors[i3].range + 1) * Math.sign(sensor34Vector.y))
                    );

                    let intersection = gap1.findIntersection(gap2);
                    if (intersection !== undefined) {
                      if (visualization) {
                        solConsole.addLine(`The distress beacon is surrounded by sensors ${i1 + 1}, ${i2 + 1}, ${i3 + 1} and ${i4 + 1}.`);
                        solConsole.addLine(`It is located at x = ${intersection.x}, y = ${intersection.y}.`);
                      }
                      return intersection.x * 4000000 + intersection.y;
                    }
                  }
                }
              }
            }
          }
        }

        throw new Error("Beacon not found");
      }
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
 * Puzzle sensor class.
 */
class Sensor {
  /**
   * @param {Vector2D} position Sensor position.
   * @param {Vector2D} closestBeaconPosition Closest beacon position.
   */
  constructor(position, closestBeaconPosition) {
    /**
     * Sensor position.
     * @type {Vector2D}
     */
    this.position = position;
    /**
     * Closest beacon position.
     * @type {Vector2D}
     */
    this.closestBeaconPosition = closestBeaconPosition;
    /**
     * Sensor range as a Manhattan distance.
     * @type {number}
     */
    this.range = closestBeaconPosition.clone().subtract(position).manhattanLength();
  }
}