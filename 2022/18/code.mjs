import { delay, Console, Renderer, RendererColor, RendererCuboid, Vector3D } from "../../utility.mjs";

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
   * @returns {Vector3D[]} Cubes.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let cubes = input.trim().split(/\r?\n/).map((line, index) => {
      let match = line.match(/^(\d+),(\d+),(\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return new Vector3D(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    });

    consoleLine.innerHTML += " done.";
    return cubes;
  }

  /**
   * Calculates the surface area.
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Surface area.
   */
  async solve(part, input, visualization) {
    const cubeColor = new RendererColor(0, 0.66, 0, 1);

    try {
      this.isSolving = true;

      let cubes = this.parse(input);

      // Find minimum cube coordinates
      let mapMin = new Vector3D(cubes.reduce((acc, e) => Math.min(acc, e.x), Number.MAX_VALUE),
        cubes.reduce((acc, e) => Math.min(acc, e.y), Number.MAX_VALUE),
        cubes.reduce((acc, e) => Math.min(acc, e.z), Number.MAX_VALUE));
      mapMin.subtract(new Vector3D(1, 1, 1));

      // Translate cube coordinates
      for (let cube of cubes)
        cube.subtract(mapMin);

      // Find maximum cube coordinates
      let mapMax = new Vector3D(cubes.reduce((acc, e) => Math.max(acc, e.x), Number.MIN_VALUE),
        cubes.reduce((acc, e) => Math.max(acc, e.y), Number.MIN_VALUE),
        cubes.reduce((acc, e) => Math.max(acc, e.z), Number.MIN_VALUE));
      mapMax.add(new Vector3D(1, 1, 1));
      
      // Create 3D map
      let map = [];
      for (let z = 0; z <= mapMax.z; z++) {
        map.push([]);
        for (let y = 0; y <= mapMax.y; y++) {
          map[map.length - 1].push([]);
          for (let x = 0; x <= mapMax.x; x++)
            map[map.length - 1][map[map.length - 1].length - 1].push(0);
        }
      }

      // Set 3D map points to 1 at cube positions
      for (let cube of cubes)
        map[cube.z][cube.y][cube.x] = 1;
      
      // Fill map with 2 from outside
      let outsideCubes = [new Vector3D(0, 0, 0)];
      map[0][0][0] = 2;
      while (outsideCubes.length) {
        let {x, y, z} = outsideCubes.shift();
        if (x > 0 && map[z][y][x - 1] == 0) {
          map[z][y][x - 1] = 2;
          outsideCubes.push(new Vector3D(x - 1, y, z));
        }
        if (x < mapMax.x && map[z][y][x + 1] == 0) {
          map[z][y][x + 1] = 2;
          outsideCubes.push(new Vector3D(x + 1, y, z));
        }
        if (y > 0 && map[z][y - 1][x] == 0) {
          map[z][y - 1][x] = 2;
          outsideCubes.push(new Vector3D(x, y - 1, z));
        }
        if (y < mapMax.y && map[z][y + 1][x] == 0) {
          map[z][y + 1][x] = 2;
          outsideCubes.push(new Vector3D(x, y + 1, z));
        }
        if (z > 0 && map[z - 1][y][x] == 0) {
          map[z - 1][y][x] = 2;
          outsideCubes.push(new Vector3D(x, y, z - 1));
        }
        if (z < mapMax.z && map[z + 1][y][x] == 0) {
          map[z + 1][y][x] = 2;
          outsideCubes.push(new Vector3D(x, y, z + 1));
        }
      }

      // Calculate surface area
      let surfaceArea = 0;
      for (let cube of cubes) {
        if (map[cube.z][cube.y][cube.x - 1] == 2 || (part == 1 && map[cube.z][cube.y][cube.x - 1] == 0))
          surfaceArea++;
        if (map[cube.z][cube.y][cube.x + 1] == 2 || (part == 1 && map[cube.z][cube.y][cube.x + 1] == 0))
          surfaceArea++;
        if (map[cube.z][cube.y - 1][cube.x] == 2 || (part == 1 && map[cube.z][cube.y - 1][cube.x] == 0))
          surfaceArea++;
        if (map[cube.z][cube.y + 1][cube.x] == 2 || (part == 1 && map[cube.z][cube.y + 1][cube.x] == 0))
          surfaceArea++;
        if (map[cube.z - 1][cube.y][cube.x] == 2 || (part == 1 && map[cube.z - 1][cube.y][cube.x] == 0))
          surfaceArea++;
        if (map[cube.z + 1][cube.y][cube.x] == 2 || (part == 1 && map[cube.z + 1][cube.y][cube.x] == 0))
          surfaceArea++;
      }

      if (visualization) {
        let renderer = new Renderer();
        this.visContainer.append(renderer.container);

        for (let cube of cubes) {
          let cuboid = new RendererCuboid(1, 1, 1, cubeColor);
          cuboid.origin = cube.clone().subtract(new Vector3D(0.5, 0.5, 0.5));
          renderer.addObject(cuboid);
        }

        renderer.cameraTarget.x = mapMax.x / 2;
        renderer.cameraTarget.y = mapMax.y / 2;
        renderer.cameraTarget.z = mapMax.z / 2;
        renderer.cameraPosition = new Vector3D(1, 1, 1).multiply(Math.max(mapMax.x, mapMax.y, mapMax.z)).add(renderer.cameraTarget);
        renderer.cameraUpDirection = renderer.cameraTarget.clone().subtract(renderer.cameraPosition).cross(new Vector3D(1, -1, 0)).normalize();
        renderer.render();
      }

      return surfaceArea;
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