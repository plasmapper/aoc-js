import { delay, Console, Vector3D } from "../../utility.mjs";

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
   * @returns {Particle[]} Particles.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let particles = input.trim().split(/\r?\n/).map((line, index) => {
      let match = line.match(/^p=<(-?\d+),(-?\d+),(-?\d+)>, v=<(-?\d+),(-?\d+),(-?\d+)>, a=<(-?\d+),(-?\d+),(-?\d+)>$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return new Particle(new Vector3D(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])),
                          new Vector3D(parseInt(match[4]), parseInt(match[5]), parseInt(match[6])),
                          new Vector3D(parseInt(match[7]), parseInt(match[8]), parseInt(match[9])));
    });

    consoleLine.innerHTML += " done.";
    return particles;
  }

  /**
   * Finds the index of the particle that will stay closest to position <0,0,0> in the long term (part 1) or the number of particles left after all collisions are resolved (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Index of the particle that will stay closest to position <0,0,0> in the long term (part 1) or the number of particles left after all collisions are resolved (part 2).
   */
  async solve(part, input, visualization) {
    try {
      this.isSolving = true;

      let particles = this.parse(input);
      
      let visConsole = new Console();
      if (visualization)
        this.visContainer.append(visConsole.container);

      let collided = new Array(particles.length).fill(false);

      let maxCollisionTick = 0;
      // Find max possible collision tick:
      // p(t) = p + v * t + a * t * (t + 1) / 2
      // da * t * t + (da + 2 * dv) * t + 2 * dp = 0
      if (part == 2) {
        for (let i1 = 0; i1 < particles.length; i1++) {
          for (let i2 = i1 + 1; i2 < particles.length; i2++) {
            let da = particles[i2].acceleration.clone().subtract(particles[i1].acceleration);
            let dv = particles[i2].velocity.clone().subtract(particles[i1].velocity);
            let dp = particles[i2].position.clone().subtract(particles[i1].position);

            da = [da.x, da.y, da.z];
            dv = [dv.x, dv.y, dv.z];
            dp = [dp.x, dp.y, dp.z];
            for (let i = 0; i < 3; i++) {
              let a = da[i], b = (da[i] + 2 * dv[i]), c = 2 * dp[i];
              
              if (a == 0 && b != 0)
                maxCollisionTick = Math.max(maxCollisionTick, -c / b);
              else if (a != 0 && b * b - 4 * a * c >= 0)
                maxCollisionTick = Math.max(maxCollisionTick, (-b + Math.sqrt(b * b - 4 * a * c)) / 2 / a);
            }
          }
        }        
      }

      for (let tick = 0; part == 1 || tick <= maxCollisionTick; tick++) {
        if (part == 1) {
          // If for every particle the coordinate positions, velocities and accelerations are either all >= 0 or <= 0:
          // Select particles with the lowest |ax| + |ay| + |az|.
          // Among these particles select particles with the lowest |vx| + |vy| + |vz|.
          // Among these particles select particles with the lowest |px| + |py| + |pz|.
          if (particles.every(particle => {
            let x = [particle.position.x, particle.velocity.x, particle.acceleration.x];
            let y = [particle.position.y, particle.velocity.y, particle.acceleration.y];
            let z = [particle.position.z, particle.velocity.z, particle.acceleration.z];
            if ((x.every(e => e <= 0) || x.every(e => e >= 0)) && (y.every(e => e <= 0) || y.every(e => e >= 0)) && (z.every(e => e <= 0) || z.every(e => e >= 0)))
              return true;
          })) {
            let closestParticle = particles.reduce((particle1, particle2) => {
              let a1 = Math.abs(particle1.acceleration.x) + Math.abs(particle1.acceleration.y) + Math.abs(particle1.acceleration.z);
              let a2 = Math.abs(particle2.acceleration.x) + Math.abs(particle2.acceleration.y) + Math.abs(particle2.acceleration.z);
              let v1 = Math.abs(particle1.velocity.x) + Math.abs(particle1.velocity.y) + Math.abs(particle1.velocity.z);
              let v2 = Math.abs(particle2.velocity.x) + Math.abs(particle2.velocity.y) + Math.abs(particle2.velocity.z);
              let p1 = Math.abs(particle1.position.x) + Math.abs(particle1.position.y) + Math.abs(particle1.position.z);
              let p2 = Math.abs(particle2.position.x) + Math.abs(particle2.position.y) + Math.abs(particle2.position.z);
              if (a2 < a1 || (a1 == a2 && (v2 < v1 || (v1 == v2 && p2 < p1))))
                return particle2;
              return particle1;
            }, particles[0]);

            let closestParticleIndex = particles.findIndex(e => e.position == closestParticle.position && e.velocity == closestParticle.velocity && e.acceleration == closestParticle.acceleration);

            if (visualization)
              visConsole.addLine(`Particle <span class="highlight">${closestParticleIndex}</span> will stay closest to position <0,0,0> in the long term.`);

            return closestParticleIndex;
          }
        }
        else {
          // Check for collisions
          let collision = false;
          for (let i1 = 0; i1 < particles.length; i1++) {
            if (!collided[i1]) {
              let collisions = [];
              for (let i2 = i1 + 1; i2 < particles.length; i2++) {
                if (particles[i1].position.equals(particles[i2].position)) {
                  collisions.push(i2);
                  collided[i2] = true;
                }                
              }

              if (collisions.length > 0) {
                collided[i1] = true;

                if (visualization) {
                  if (!collision)
                    visConsole.addLine(`Tick ${tick}:`)
                  visConsole.addLine(`Particles ${[i1, ...collisions].join(", ")} collide at p=<${particles[i1].position.x}, ${particles[i1].position.y}, ${particles[i1].position.z}>.`);
                }
                collision = true;
              }      
            }
          }

          let particlesLeft = collided.reduce((acc, e) => acc + (e ? 0 : 1), 0);
          if (collision && visualization) {
            visConsole.addLine(`Particles left: ${particlesLeft}.`);
            visConsole.addLine();
          }
        }

        // Move particles
        for (let particle of particles) {
          particle.velocity.add(particle.acceleration);
          particle.position.add(particle.velocity);
        }
      }

      let particlesLeft = collided.reduce((acc, e) => acc + (e ? 0 : 1), 0);
      return particlesLeft;
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
 * Puzzle particle class.
 */
class Particle {
  /**
   * @param {Vector3D} position Position.
   * @param {Vector3D} velocity Velocity.
   * @param {Vector3D} acceleration Acceleration.
   */
  constructor(position, velocity, acceleration) {
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
    /**
     * Acceleration.
     * @type {Vector3D}
     */
    this.acceleration = acceleration;
  }
}