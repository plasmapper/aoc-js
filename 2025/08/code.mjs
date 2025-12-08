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
   * @returns {Box[]} Boxes.
   */
  parse(input) {
    let consoleLine = this.solConsole.addLine("Parsing...");

    let boxes = input.trim().split(/\r?\n/).map((line, index) => {
      let match = line.match(/^(\d+),(\d+),(\d+)$/);
      if (match == null)
        throw new Error(`Invalid data in line ${index + 1}`);
      return new Box(new Vector3D(parseInt(match[1]), parseInt(match[2]), parseInt(match[3])));
    });

    consoleLine.innerHTML += " done.";
    return boxes;
  }

  /**
   * Calculates the product of the sizes of the three largest circuits after partial connection (part 1) or the product of the X coordinates of the last connected junction boxes before full connection (part 2).
   * @param {number} part Puzzle part.
   * @param {string} input Puzzle input.
   * @param {boolean} visualization Enable visualization.
   * @returns {number} Product of the sizes of the three largest circuits after partial connection (part 1) or the product of the X coordinates of the last connected junction boxes before full connection (part 2).
   */
  async solve(part, input, visualization) {
    const defaultBoxColor = new RendererColor(0.6, 0.6, 0.6, 1);
    const group1BoxColor = new RendererColor(1, 1, 0, 1);
    const group2BoxColor = new RendererColor(1, 1, 1, 1);
    const group3BoxColor = new RendererColor(0, 0.66, 0, 1);

    try {
      this.isSolving = true;

      let boxes = this.parse(input);
      let numberOfConnections = boxes.length < 50 ? 10 : 1000;

      if (boxes.length < 2)
        throw new Error(`Number of junction boxes is less than 2`);

      // Get all box pairs
      let boxPairs = [];
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          let distance = boxes[i].position.clone().subtract(boxes[j].position).abs();
          boxPairs.push(new BoxPair(boxes[i], boxes[j], distance));
        }
      }

      // Sort box pairs by distance
      boxPairs.sort((a, b) => a.distance - b.distance);

      let solConsoleLine;
      let renderer;
      if (visualization) {
        if (part == 1)
          this.solConsole.addLine(`Number of connections: ${numberOfConnections}.`);
        solConsoleLine = this.solConsole.addLine();

        let mapMin = new Vector3D(boxes.reduce((acc, e) => Math.min(acc, e.position.x), Number.MAX_VALUE),
          boxes.reduce((acc, e) => Math.min(acc, e.position.y), Number.MAX_VALUE),
          boxes.reduce((acc, e) => Math.min(acc, e.position.z), Number.MAX_VALUE));

        let mapMax = new Vector3D(boxes.reduce((acc, e) => Math.max(acc, e.position.x), Number.MIN_VALUE),
          boxes.reduce((acc, e) => Math.max(acc, e.position.y), Number.MIN_VALUE),
          boxes.reduce((acc, e) => Math.max(acc, e.position.z), Number.MIN_VALUE));

        let mapSize = mapMax.clone().subtract(mapMin);
        let mapShrinkCoefficient = Math.max(mapSize.x, mapSize.y, mapSize.z);
        let visBoxSize = 0.02;
          
        renderer = new Renderer();
        this.visContainer.append(renderer.container);

        renderer.cameraTarget.x = 0.5;
        renderer.cameraTarget.y = 0.5;
        renderer.cameraTarget.z = 0.5;
        renderer.cameraPosition = new Vector3D(2, 2, 2);
        renderer.cameraUpDirection = renderer.cameraTarget.clone().subtract(renderer.cameraPosition).cross(new Vector3D(1, -1, 0)).normalize();

        for (let box of boxes) {
          box.visCuboid = new RendererCuboid(visBoxSize, visBoxSize, visBoxSize, defaultBoxColor);
          box.visCuboid.origin = box.position.clone()
            .subtract(mapMin).divide(mapShrinkCoefficient).subtract(new Vector3D(visBoxSize / 2, visBoxSize / 2, visBoxSize / 2));
          renderer.addObject(box.visCuboid);
        }

        renderer.render();
      }

      // Connect box pairs
      let connectonIndex = 0;
      let circuits = boxes.map(e => e.circuit);
      for (; connectonIndex < boxPairs.length && ((part == 1 && connectonIndex < numberOfConnections) || (part == 2 && circuits.length > 1)); connectonIndex++) {
        if (this.isStopping)
          return;

        let box1 = boxPairs[connectonIndex].box1;
        let box2 = boxPairs[connectonIndex].box2;
        
        if (visualization && part == 1)
          solConsoleLine.innerHTML = `Connection: ${connectonIndex + 1}.`;

        if (box1.circuit != box2.circuit) {
          circuits.splice(circuits.indexOf(box2.circuit), 1);
          for (let box2CircuitBox of box2.circuit) {
            box1.circuit.push(box2CircuitBox);
            box2CircuitBox.circuit = box1.circuit;
          }

          if (visualization) {
            if (part == 2)
              solConsoleLine.innerHTML = `Number of circuits: ${circuits.length}.`;

            circuits.sort((a, b) => b.length - a.length);
            for (let i = 0; i < circuits.length; i++) {
              for (let box of circuits[i])
                box.visCuboid.color = i == 0 ? group1BoxColor : (i == 1 ? group2BoxColor : (i == 2 ? group3BoxColor : defaultBoxColor));
            }
            renderer.render();
            await delay(1);
          }
        }
      }

      if (part == 1) {
        if (circuits.length < 3)
          throw new Error(`Number of circuits is less than 3`);
        circuits.sort((a, b) => b.length - a.length);
        return circuits[0].length * circuits[1].length * circuits[2].length;
      }
      else
        return boxPairs[connectonIndex - 1].box1.position.x * boxPairs[connectonIndex - 1].box2.position.x;
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
 * Puzzle box class.
 */
class Box {
  /**
   * @param {Vector3D} position Position.
   */
  constructor(position) {
    /**
     * Position.
     * @type {Vector3D}
     */
    this.position = position;
    /**
     * Circuit.
     * @type {Box[]}
     */
    this.circuit = [this];
    /**
     * Visualization cuboid.
     * @type {RendererCuboid}
     */    
    this.visCuboid = null;
  }
}

/**
 * Puzzle box pair class.
 */
class BoxPair {
  /**
   * @param {Box} box1 Box 1.
   * @param {Box} box2 Box 2. 
   * @param {number} distance Distance.
   */
  constructor(box1, box2, distance) {
    /**
     * Box 1.
     * @type {Box}
     */
    this.box1 = box1;
    /**
     * Box 2.
     * @type {Box}
     */
    this.box2 = box2;
    /**
     * Distance.
     * @type {number}
     */
    this.distance = distance;
  }
}