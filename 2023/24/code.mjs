import { delay, Console, Range, Vector3D, greatestCommonDivisor, linearSystemSolution  } from "../../utility.mjs";

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
   * @returns {Hailstone[]} Hailstones.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let hailstones = [];
    input.trim().split(/\r?\n/).forEach((line, index) => {
      let match = line.replaceAll(/\s+/g, " ").match(/^(-?\d+), (-?\d+), (-?\d+) @ (-?\d+), (-?\d+), (-?\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      
      hailstones.push(new Hailstone(new Vector3D(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])),
        new Vector3D(parseInt(match[4]), parseInt(match[5]), parseInt(match[6]))))
    });

    consoleLine.innerHTML += " done.";
    return hailstones;
  }

  /**
   * Finds the number of trajectory intersections (part 1) or position and velocity of the rock that will smash all hailstones (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Number of trajectory intersections (part 1) or sum of coordinates of the rock that will smash all hailstones (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let hailstones = this.parse(input);

      if (part == 1) {
        let testAreaRange = hailstones.length < 10 ? new Range(7, 27) : new Range(200000000000000, 400000000000000);
        let numberOfIntersections = 0;
        for (let i = 0; i < hailstones.length; i++) {
          for (let j = i + 1; j < hailstones.length; j++) {
            let hs1 = hailstones[i];
            let hs2 = hailstones[j];
  
            if (hs1 != hs2) {
              let x1 = hs1.position.x, y1 = hs1.position.y, vx1 = hs1.velocity.x, vy1 = hs1.velocity.y;
              let x2 = hs2.position.x, y2 = hs2.position.y, vx2 = hs2.velocity.x, vy2 = hs2.velocity.y;
  
              let a1 = vy1 / vx1;
              let b1 = y1 - a1 * x1;
              let a2 = vy2 / vx2;
              let b2 = y2 - a2 * x2;
  
              if (a1 != a2) {
                let intX = (b2 - b1) / (a1 - a2);
                let intY = a1 * intX + b1;
                if (testAreaRange.contains(intX) && testAreaRange.contains(intY) && (vx1 > 0 ? intX > x1 : intX < x1) && (vx2 > 0 ? intX > x2 : intX < x2))
                  numberOfIntersections++;
              }
            }
          }
        }

        return numberOfIntersections;
      }
      else {
        let r0 = new Vector3D(BigInt(hailstones[0].position.x), BigInt(hailstones[0].position.y), BigInt(hailstones[0].position.z));
        let r1 = new Vector3D(BigInt(hailstones[1].position.x), BigInt(hailstones[1].position.y), BigInt(hailstones[1].position.z));
        let r2 = new Vector3D(BigInt(hailstones[2].position.x), BigInt(hailstones[2].position.y), BigInt(hailstones[2].position.z));
        let v0 = new Vector3D(BigInt(hailstones[0].velocity.x), BigInt(hailstones[0].velocity.y), BigInt(hailstones[0].velocity.z));
        let v1 = new Vector3D(BigInt(hailstones[1].velocity.x), BigInt(hailstones[1].velocity.y), BigInt(hailstones[1].velocity.z));
        let v2 = new Vector3D(BigInt(hailstones[2].velocity.x), BigInt(hailstones[2].velocity.y), BigInt(hailstones[2].velocity.z));

        // Hailstone 1 and 2 positions and velocities relative to hailstone 0
        let r01 = r1.clone().subtract(r0);
        let v01 = v1.clone().subtract(v0);
        let r02 = r2.clone().subtract(r0);
        let v02 = v2.clone().subtract(v0);
        
        // Rock trajectory relative to hailstone 0
        let v = r01.cross(v01).cross(r02.cross(v02));
        v.divide(greatestCommonDivisor(v.x, greatestCommonDivisor(v.y, v.z)));
        
        // Intersection times and positions for hailstones 1 and 2 relative to hailstone 0
        let t1 = linearSystemSolution([[v.x, -v01.x, r01.x], [v.y, -v01.y, r01.y]])[1];
        let t2 = linearSystemSolution([[v.x, -v02.x, r02.x], [v.y, -v02.y, r02.y]])[1];
        let intersection1 = r01.clone().add(v01.clone().multiply(t1));
        let intersection2 = r02.clone().add(v02.clone().multiply(t2));

        // Rock velocity relative to hailstone 0
        v = intersection2.clone().subtract(intersection1).divide(t2 - t1);
        let t0 = v.clone().multiply(t1).subtract(intersection1).x / v.x;

        // Rock initial position
        let r = r0.clone().subtract(v.clone().multiply(t0));

        // Rock velocity
        v.add(v0);

        // Check that the rock smashes all the hailstones
        for (let hailstone of hailstones) {
          let dr = new Vector3D(BigInt(hailstone.position.x), BigInt(hailstone.position.y), BigInt(hailstone.position.z)).subtract(r);
          let dv = v.clone().subtract(new Vector3D(BigInt(hailstone.velocity.x), BigInt(hailstone.velocity.y), BigInt(hailstone.velocity.z)));
          let tx = dv.x == 0 ? undefined : dr.x / dv.x;
          let ty = dv.y == 0 ? undefined : dr.y / dv.y;
          let tz = dv.z == 0 ? undefined : dr.z / dv.z;
          let t = tx != undefined ? tx : (ty != undefined ? ty : tz)

          if ((tx != undefined && tx != t) || (ty != undefined && ty != t) || (tz != undefined && tz != t))
            throw new Error("No soultion found");
        }

        if (visualization) {
          let visConsole = new Console();
          this.visContainer.append(visConsole.container);
          visConsole.addLine(`Rock initial position:\n  X = ${r.x}\n  Y = ${r.y}\n  Z = ${r.z}`);
          visConsole.addLine(`Rock velocity:\n  Vx = ${v.x}\n  Vy = ${v.y}\n  Vz = ${v.z}`);
        }

        return r.x + r.y + r.z;
      }

      return 0;
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
 * Puzzle hailstone class
 */
class Hailstone {
  /**
   * @param {Vector3D} position Position.
   * @param {Vector3D} velocity Velocity.
   */
  constructor(position, velocity) {
    /**
     * Position.
     * @type {Vector3D}
     */
    this.position = position;
    /**
     * Velocity.
     * @type {Vector3D}
     */
    this.velocity = velocity;
  }
}
