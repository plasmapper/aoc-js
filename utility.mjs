/**
 * Console window class.
 */
export class Console {
  constructor() {
    /**
     * HTML element that contains the console lines.
     * @type {HTMLElement}
     */
    this.container;
    /**
     * Console lines.
     * @type {HTMLParagraphElement[]}
     */
    this.lines = [];

    if (typeof document !== "undefined") {
      this.container = document.createElement("code");
      this.container.style.position = "relative";
    }
  }

  /**
   * Adds a line to the console.
   * @param {string} [text=""] Console line initial text.
   * @returns {HTMLParagraphElement} New console line.
   */
  addLine(text = "") {
    let line;
    if (typeof this.container !== "undefined") {
      line = document.createElement("p");
      line.innerHTML = text;
      this.container.append (line);
    }
    else
      line = {innerHTML: ""};
    this.lines.push(line);
    return line;
  }

  /**
   * Removes all lines from the console.
   */
  clear() {
    if (typeof this.container !== "undefined")
      this.container.innerHTML = "";
    this.lines = [];
  }
}

/**
 * Pixel map visualization class.
 */
export class PixelMap {
  /**
   * @param {number} width Pixel map width.
   * @param {number} height Pixel map height.
   */
  constructor (width, height) {
    const maxMapScreenWidth = 460;
    const maxMapScreenHeight = 800;

    /**
     * HTML canvas.
     * @type {HTMLCanvasElement}
     */
    this.container;
    /**
     * Canvas 2D context
     * @type {CanvasRenderingContext2D}
     */
    this.context;
    /**
     * Pixel map width.
     * @type {number}
     */
    this.width = width;
    /**
     * Pixel map height.
     * @type {number}
     */
    this.height = height;
    /**
     * Pixel size in screen pixels.
     * @type {number}
     */
    this.pixelSize = Math.max(1, Math.min(Math.floor(maxMapScreenWidth / this.width), Math.floor(maxMapScreenHeight / this.height)));
    /**
     * Color palette.
     * @type {string[]}
     */
    this.palette = [];

    this.image = [];
    for (let y = 0; y < this.height; y++)
      this.image.push(new Array(this.width).fill(0));

    if (typeof document !== "undefined") {
      this.container = document.createElement("canvas");
      this.container.width = this.width * this.pixelSize;
      this.container.height = this.height * this.pixelSize;
      this.context = this.container.getContext("2d");
    }
  }

  /**
   * Draws an image.
   * @param {number[][]} image Image as an array of horizontal lines that are arrays of color indexes for each pixel.
   */
  draw(image) {
    if (typeof this.context !== "undefined")
      this.context.clearRect(0, 0, this.width * this.pixelSize, this.height * this.pixelSize);

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.image[y][x] = image[y][x];
        this.drawPixel(x, y, this.image[y][x]);
      }
    }
  }

  /**
   * Draws a single pixel.
   * @param {number} x X coordinate.
   * @param {number} y Y coordinate.
   * @param {number} colorIndex Color index.
   */
  drawPixel(x, y, colorIndex) {
    this.image[y][x] = colorIndex;

    if (typeof this.context !== "undefined") {
      if (colorIndex != 0) {
        this.context.fillStyle = this.palette[colorIndex];
        this.context.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
      }
      else
        this.context.clearRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
    }
  }

  /**
   * Fills the pixel map with the specified colorIndex starting at the specified pixel.
   * @param {number} x Fill start X coordinate.
   * @param {number} y Fill start Y coordinate.
   * @param {number} colorIndex Color index.
   */
  fill(x, y, colorIndex) {
    let oldColorIndex = this.image[y][x];

    let stack = [{x1: x, x2: x, y: y, dy: 1}, {x1: x, x2: x, y: y - 1, dy: -1}];
    while (stack.length) {
      let {x1, x2, y, dy} = stack.pop();
      let x = x1;
      if (this.image[y] != undefined && this.image[y][x] == oldColorIndex) {
        for (; this.image[y][x - 1] == oldColorIndex; x--)
          this.drawPixel(x - 1, y, colorIndex);
        
        if (x < x1)
          stack.push({x1: x, x2: x1 - 1, y: y - dy, dy: -dy});
      }
      while (x1 <= x2) {
        for (; this.image[y] != undefined && this.image[y][x1] == oldColorIndex; x1++)
          this.drawPixel(x1, y, colorIndex);
        if (x1 > x)
          stack.push({x1: x, x2: x1 - 1, y: y + dy, dy: dy});
        if (x1 - 1 > x2)
          stack.push({x1: x2 + 1, x2: x1 - 1, y: y - dy, dy: -dy});
        x1 = x1 + 1;
        for (; x1 < x2 && this.image[y] != undefined && this.image[y][x1] != oldColorIndex; x1++);
        x = x1;
      }
    }
  }
}

/**
 * Renderer class.
 */
export class Renderer {
  constructor () {
    /**
     * HTML canvas.
     * @type {HTMLCanvasElement}
     */
    this.container;
    /**
     * WebGL context
     * @type {CanvasRenderingContext2D}
     */
    this.gl;
    /**
     * Shader program info.
     */
    this.shaderProgramInfo;
    /**
     * Vertex buffer.
     */
    this.vertexBuffer;
    /**
     * Normal buffer.
     */
    this.normalBuffer;
    /**
     * Color Buffer.
     */
    this.colorBuffer;
    /**
     * Scene objects.
     * @type {RendererObject[]}
     */
    this.objects = [];
    /**
     * Camera position.
     * @type {Vector3D}
     */
    this.cameraPosition = new Vector3D(1, 1, 1);
    /**
     * Camera position.
     * @type {Vector3D}
     */
    this.cameraTarget = new Vector3D(0, 0, 0);
    /**
     * Camera position.
     * @type {Vector3D}
     */
    this.cameraUpDirection = new Vector3D(-1, -1, 1).normalize();

    if (typeof document !== "undefined") {
      this.container = document.createElement("canvas");
      this.gl = this.container.getContext("webgl");
      let gl = this.gl;
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      this.vertexBuffer = gl.createBuffer();
      this.normalBuffer = gl.createBuffer();
      this.colorBuffer = gl.createBuffer();

      let vertexShaderSource = `
      attribute vec3 vertex; attribute vec3 normal; attribute vec3 color; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; varying vec3 vNormal; varying vec3 vColor;
  
      void main(void) {
        vNormal = normal;
        vColor = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vertex, 1.0);
      }`;

      let vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);

      let fragmentShaderSource = `
      precision mediump float; uniform vec3 view; uniform vec3 light; varying vec3 vNormal; varying vec3 vColor;
  
      void main(void) {
        float d = clamp (dot (-light, vNormal), 0.0, 1.0);
        vec3 h = normalize (-light - view);
        float s = pow (clamp (dot (vNormal, h), 0.0, 1.0), 20.0);
        vec3 aColor = vColor * 0.2;
        vec3 dColor = vColor * d * 0.6;
        vec3 sColor = vColor * s * 0.2;
        gl_FragColor = vec4 (clamp (aColor + dColor + sColor, 0.0, 1.0), 1.0);
      }`;

      let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);

      let shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);
      
      this.shaderProgramInfo = {
        program: shaderProgram,
        vertexAttribLocation: gl.getAttribLocation(shaderProgram, "vertex"),
        normalAttribLocation: gl.getAttribLocation(shaderProgram, "normal"),
        colorAttribLocation: gl.getAttribLocation(shaderProgram, "color"),
        projectionMatrixAttribLocation: gl.getUniformLocation(shaderProgram,"projectionMatrix"),
        modelViewMatrixAttribLocation: gl.getUniformLocation(shaderProgram, "modelViewMatrix"),
        viewAttribLocation: gl.getUniformLocation(shaderProgram, "view"),
        lightAttribLocation: gl.getUniformLocation(shaderProgram, "light"),
      };

      gl.useProgram(this.shaderProgramInfo.program);
    }
  }

  /**
   * Adds an object to the scene.
   * @param {RendererObject} object New object.
   */
  addObject(object) {
    this.objects.push(object);
  }

  /**
   * Renders the scene.
   */
  render() {
    let gl = this.gl;
    gl.canvas.width = gl.canvas.clientWidth;
    gl.canvas.height = gl.canvas.clientHeight;
    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let projectionMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projectionMatrix, (45 * Math.PI) / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 50000);
    gl.uniformMatrix4fv(this.shaderProgramInfo.projectionMatrixAttribLocation, false, projectionMatrix);

    let modelViewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.lookAt(modelViewMatrix,
      [this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z],
      [this.cameraTarget.x, this.cameraTarget.y, this.cameraTarget.z],
      [this.cameraUpDirection.x, this.cameraUpDirection.y, this.cameraUpDirection.z]);
    gl.uniformMatrix4fv(this.shaderProgramInfo.modelViewMatrixAttribLocation, false, modelViewMatrix);

    let view = this.cameraTarget.clone().subtract(this.cameraPosition).normalize();
    let light = view.clone().add(this.cameraUpDirection).add(view.clone().cross(this.cameraUpDirection).multiply(-1)).normalize();
    gl.uniform3fv (this.shaderProgramInfo.viewAttribLocation, [view.x, view.y, view.z]);
    gl.uniform3fv (this.shaderProgramInfo.lightAttribLocation, [light.x, light.y, light.z]);

    let vertexCoordinates = [];
    let normalCoordinates = [];
    let colors = [];
    
    for (let object of this.objects) {
      for (let vertex of object.vertices) {
        vertexCoordinates.push(vertex.x + object.origin.x, vertex.y + object.origin.y, vertex.z + object.origin.z);
        colors.push(object.color.red, object.color.green, object.color.blue);
      }
      for (let normal of object.normals)
        normalCoordinates.push(normal.x, normal.y, normal.z);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexCoordinates), gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.shaderProgramInfo.vertexAttribLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.shaderProgramInfo.vertexAttribLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoordinates), gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.shaderProgramInfo.normalAttribLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.shaderProgramInfo.normalAttribLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.shaderProgramInfo.colorAttribLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.shaderProgramInfo.colorAttribLocation);

    gl.drawArrays(gl.TRIANGLES, 0, vertexCoordinates.length);
  }
}

/**
 * Renderer color class.
 */
export class RendererColor {
  /**
   * @param {number} red Red component.
   * @param {number} green Green component.
   * @param {number} blue Blue component.
   */
  constructor(red, green, blue) {
    /**
     * Red component (0.0-1.0).
     * @type {number}
     */
    this.red = red;
    /**
     * Green component (0.0-1.0).
     * @type {number}
     */
    this.green = green;
    /**
     * Blue component (0.0-1.0).
     * @type {number}
     */
    this.blue = blue;
  }
}

/**
 * Renderer object class.
 */
export class RendererObject {
  /**
   * @param {Vector3D[]} vertices Object vertices.
   * @param {Vector3D[]} normals Object vertex normals.
   * @param {RendererColor} colors Object color.
   */
  constructor(vertices, normals, color) {
    /**
     * Object vertices.
     * @type {Vector3D[]}
     */
    this.vertices = vertices;
    /**
     * Object vertex normals.
     * @type {Vector3D[]}
     */
    this.normals = normals;
    /**
     * Object color.
     * @type {RendererColor}
     */
    this.color = color;
    /**
     * Object origin point.
     */
    this.origin = new Vector3D(0, 0, 0);
  }
}

/**
 * Renderer colored rectangular cuboid class.
 */
export class RendererCuboid extends RendererObject {
  /**
   * @param {number} xSize X size.
   * @param {number} xSize Y size.
   * @param {number} xSize Z size.
   * @param {RendererColor} color Color.
   */
  constructor(xSize, ySize, zSize, color) {
    let vertices = [];
    let normals = [];

    let corners = [new Vector3D(0, 0, 0), new Vector3D(xSize, 0, 0), new Vector3D(xSize, ySize, 0), new Vector3D(0, ySize, 0),
      new Vector3D(0, 0, zSize), new Vector3D(xSize, 0, zSize), new Vector3D(xSize, ySize, zSize), new Vector3D(0, ySize, zSize)];

    vertices.push(corners[0], corners[2], corners[1], corners[0], corners[3], corners[2]);
    vertices.push(corners[0], corners[1], corners[5], corners[0], corners[5], corners[4]);
    vertices.push(corners[1], corners[2], corners[6], corners[1], corners[6], corners[5]);
    vertices.push(corners[2], corners[3], corners[7], corners[2], corners[7], corners[6]);
    vertices.push(corners[0], corners[7], corners[3], corners[0], corners[4], corners[3]);
    vertices.push(corners[4], corners[5], corners[6], corners[4], corners[6], corners[7]);

    let sideNormals = [new Vector3D(0, 0, -1), new Vector3D(0, -1, 0), new Vector3D(1, 0, 0), new Vector3D(0, 1, 0), new Vector3D(-1, 0, 0), new Vector3D(0, 0, 1)];
    for (let normal of sideNormals) {
      for (let i = 0; i < 6; i++)
        normals.push(normal.clone());
    }
    
    super(vertices, normals, color);
  }
}

/**
 * Graph visualization class.
 */
export class Graph {
  constructor() {
    const screenWidth = 467;
    const screenHeight = 300;

    /**
     * HTML canvas.
     * @type {HTMLCanvasElement}
     */
    this.container;
    /**
     * Chart JS chart.
     * @type {Chart}
     */
    this.chartJS;
    /**
     * Graph type.
     * @type {string}
     */
    this.type = "scatter";
    /**
     * Point radius
     * @type {number}
     */
    this.pointRadius = 2;
    /**
     * Graph axes.
     * @type {Object}
     */
    this.axes = {x: new GraphAxis(), y: new GraphAxis()};
    /**
     * Graph datasets.
     * @type {GraphDataSet[]}
     */
    this.datasets = [];

    if (typeof document !== "undefined") {
      this.container = document.createElement("canvas");
      this.container.width = screenWidth;
      this.container.height = screenHeight;
    }
  }

  initialize() {
    let scales = {};
    Object.keys(this.axes).forEach(key => {
      scales[key] = {
        display: true,
        min: this.axes[key].autoscale ? undefined : this.axes[key].range.from,
        max: this.axes[key].autoscale ? undefined : this.axes[key].range.to,
        border: {
          color: this.axes[key].color
        },
        title: {
          display: true,
          color: this.axes[key].color,
          text: this.axes[key].label
        },
        ticks: {
          color: this.axes[key].color
        }
      }
    });

    this.chartJS = new Chart(this.container, {
      type: this.type,
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: {duration: 0},
        plugins: {
          legend: {
            display: false
          },
        },
        elements: {
          point:{
              radius: this.pointRadius
          }
        },
        scales: scales          
      },
      data: {
        datasets: this.datasets.map(dataset => {
          return {
            label: dataset.label,
            data: dataset.points,
            showLine: dataset.showLine,
            borderColor: dataset.pointStrokeColor,
            pointBackgroundColor: dataset.pointFillColor
          };
        })
      }
    });
  }

  /**
   * Updates the graph.
   */
  update() {
    Object.keys(this.axes).forEach(key => {
      this.chartJS.options.scales[key].min = this.axes[key].autoscale ? undefined : this.axes[key].range.from;
      this.chartJS.options.scales[key].max = this.axes[key].autoscale ? undefined : this.axes[key].range.to;
    });
    
    this.chartJS.update();
  }
}

/**
 * Graph dataset class
 */
export class GraphDataSet {
  /**
   * @param {string} color Dataset color.
   */
  constructor() {
    /**
     * Dataset label.
     * @type {string}
     */
    this.label = "";
    /**
     * Data points.
     * @type {Vector2D[]}
     */
    this.points = [];
    /**
     * Dataset point stroke color.
     * @type {string}
     */
    this.pointStrokeColor = "#00aa00";
    /**
     * Dataset point fill color.
     * @type {string}
     */
    this.pointFillColor = "#00aa00";
    /**
     * Show dataset line.
     * @type {boolean}
     */
    this.showLine = false;
  }
}

/**
 * Graph axis class.
 */
class GraphAxis {
  constructor() {
    /**
     * Axis label.
     * @type {string}
     */
    this.label = "";
    /**
     * Axis color.
     * @type {string}
     */
    this.color = "#ffffff"
    /**
     * Axis range.
     * @type {Range}
     */
    this.range = new Range(0, 1);
    /**
     * Axis scale is calculated based on data.
     * @type {boolean}
     */
    this.autoscale = true;
  }
}

/**
 * Range class.
 */
export class Range {
  /**
   * @param {number} from Range start.
   * @param {number} to Range end.
   */
  constructor (from, to) {
    /**
     * Range start.
     * @type {number}
     */
    this.from = from;
    /**
     * Range end.
     * @type {number}
     */
    this.to = to;
  }

  /**
   * Clones the range.
   * @returns {Range} Copy of the range.
   */
  clone() {
    return new Range(this.from, this.to);
  }

  /**
   * Returns true if the value is inside the range.
   * @param {number} value Value.
   * @returns {boolean} True if the value is inside the range.
   */
  contains(value) {
    return value >= this.from && value <= this.to;
  }

  /**
   * Finds parts of the range that are to the left and to the right of the value (right range includes the value).
   * @param {number} value Value.
   * @returns {Range} Array of 2 partial ranges: left and right of the value (right range includes the value, null if partial range does not exist).
   */  
  split(value) {
    if (value <= this.from)
      return [null, this.clone()];
    else if (value > this.to)
      return [this.clone(), null];
    else
      return [new Range(this.from, value - 1), new Range(value, this.to)];
  }

  /**
   * Finds parts of the range that overlap and do not overlap with the target range.
   * @param {Range} targetRange Target range.
   * @returns {Range} Array of 3 partial ranges: left, inside and right of the target range (null if partial range does not exist).
   */  
  overlap(targetRange) {
    let parts = [new Range(this.from, this.to), null, null];

    if (targetRange.from <= this.to) {
      if (targetRange.from <= this.from) {
        parts[1] = parts[0];
        parts[0] = null;
      }
      else {
        parts[0] = new Range(this.from, targetRange.from - 1);
        parts[1] = new Range(targetRange.from, this.to);
      }
    }

    if (parts[1] != null && targetRange.to < this.to) {
      if (targetRange.to >= this.from) {
        parts[1] = new Range(parts[1].from, targetRange.to);
        parts[2] = new Range(targetRange.to + 1, this.to);
      }
      else {
        parts[2] = parts[1];
        parts[1] = null;
      }
    }

    return parts;
  }

  /**
   * Combines ranges so that they are sorted by "from" and do not have overlaps.
   * @param {Range[]} ranges Input ranges.
   * @returns {Range[]} Output ranges.
   */
  static combine(ranges) {
    ranges = ranges.sort((r1, r2) => r1.from - r2.from)
    let newRanges = [ranges[0]];
    for (let i = 1; i < ranges.length; i++) {
      if (ranges[i].from <= newRanges[newRanges.length - 1].to)
        newRanges[newRanges.length - 1].to = ranges[i].to;
      else
        newRanges.push(ranges[i]);
    }
    return newRanges;
  }
}

/**
 * 2D vector class.
 */
export class Vector2D {
  /**
   * @param {number} x X coordinate.
   * @param {number} y Y coordinate.
   */
  constructor(x, y) {
    /**
     * X coordinate.
     * @type {number}
     */
    this.x = x;
    /**
     * Y coordinate.
     * @type {number}
     */
    this.y = y;
  }

  /**
   * Checks if vector is equal to another vector.
   * @param {Vector2D} vector Vector to compare to.
   * @returns True if two vectors are equal.
   */
  equals(vector) {
    return this.x == vector.x && this.y == vector.y;
  }

  /**
   * Clones the vector.
   * @returns {Vector2D} Copy of the vector.
   */
  clone() {
    return new Vector2D(this.x, this.y);
  }

  /**
   * Calculates the length of the vector.
   * @returns {number} Length of the vector.
   */
  abs() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Normalizes the vector.
   * @returns {Vector2D} Modified vector.
   */
  normalize() {
    let abs = this.abs();
    this.x /= abs;
    this.y /= abs;

    return this;
  }
 
  /**
   * Modifies the vector by adding a vector to it.
   * @param {Vector2D} vector Vector to add.
   * @returns {Vector2D} Modified vector.
   */
  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  /**
   * Modifies the vector by subtracting a vector from it.
   * @param {Vector2D} vector Vector to subtract.
   * @returns {Vector2D} Modified vector.
   */
  subtract(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
  }

  /**
   * Modifies the vector by multiplying it by a scalar.
   * @param {number} scalar Scalar to multiply the vector by.
   * @returns {Vector2D} Modified vector.
   */
  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
  
  /**
   * Calculates the dot product of the vector with another vector.
   * @param {Vector2D} vector Vector to calculate the dot product with.
   * @returns {number} Dot product.
   */
  dot(vector) {
    return this.x * vector.x + this.y * vector.y;
  }

  /**
   * Calculates the Manhattan length of the vector (|x| + |y|).
   * @returns {number} Manhattan length of the vector.
   */
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y);
  }
}

/**
 * 3D vector class.
 */
export class Vector3D {
  /**
   * @param {number} x X coordinate.
   * @param {number} y Y coordinate.
   * @param {number} z Z coordinate.
   */
  constructor(x, y, z) {
    /**
     * X coordinate.
     * @type {number}
     */
    this.x = x;
    /**
     * Y coordinate.
     * @type {number}
     */
    this.y = y;
    /**
     * Z coordinate.
     * @type {number}
     */
    this.z = z;
  }

  /**
   * Checks if vector is equal to another vector.
   * @param {Vector3D} vector Vector to compare to.
   * @returns True if two vectors are equal.
   */
  equals(vector) {
    return this.x == vector.x && this.y == vector.y && this.z == vector.z;
  }

  /**
   * Clones the vector.
   * @returns {Vector3D} Copy of the vector.
   */
  clone() {
    return new Vector3D(this.x, this.y, this.z);
  }

  /**
   * Calculates the length of the vector.
   * @returns {number} Length of the vector.
   */
  abs() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Normalizes the vector.
   * @returns {Vector3D} Modified vector.
   */
  normalize() {
    let abs = this.abs();
    this.x /= abs;
    this.y /= abs;
    this.z /= abs;

    return this;
  }

  /**
   * Modifies the vector by adding a vector to it.
   * @param {Vector3D} vector Vector to add.
   * @returns {Vector3D} Modified vector.
   */
  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;
    return this;
  }

  /**
   * Modifies the vector by subtracting a vector from it.
   * @param {Vector3D} vector Vector to subtract.
   * @returns {Vector3D} Modified vector.
   */
  subtract(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;
    return this;
  }

  /**
   * Modifies the vector by multiplying it by a scalar.
   * @param {number} scalar Scalar to multiply the vector by.
   * @returns {Vector3D} Modified vector.
   */
  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }
  
  /**
   * Calculates the dot product of the vector with another vector.
   * @param {Vector3D} vector Vector to calculate the dot product with.
   * @returns {number} Dot product.
   */
  dot(vector) {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z;
  }

  /**
   * Calculates the cross product of the vector with another vector.
   * @param {Vector3D} vector Vector to calculate the cross product with.
   * @returns {Vector3D} Cross product.
   */
  cross(vector) {
    return new Vector3D(this.y * vector.z - this.z * vector.y, this.z * vector.x - this.x * vector.z, this.z * vector.y - this.y * vector.x);
  }
}

/**
 * Line segment class
 */
export class LineSegment2D {
  /**
   * @param {Vector2D} point1 Point 1.
   * @param {Vector2D} point2 Point 2.
   */
  constructor(point1, point2) {
    /**
     * Point 1.
     * @type {Vector2D}
     */
    this.point1 = point1;
    /**
     * Point 2.
     * @type {Vector2D}
     */
    this.point2 = point2;
  }

  /**
   * Finds intersection with another line segment.
   * @param {LineSegment2D} lineSegment Line segment to find intersection with.
   * @returns {Vector2D} Intersection (undefined if not found).
   */
  findIntersection(lineSegment) {
    let p1 = this.point1, p2 = this.point2, p3 = lineSegment.point1, p4 = lineSegment.point2;
    let t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / ((p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x));
    if (isNaN(t) || t < 0 || t > 1)
      return undefined;
    return new Vector2D(p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y));
  }
}

/**
 * Async delay.
 * @param {number} ms Delay in milliseconds.
 * @returns {Promise} Promise.
 */
export function delay(ms) {
  if (ms > 0)
    return new Promise(resolve => setTimeout(resolve, ms));
  return Promise.resolve();
}

/**
 * Calculates the least common multiple of two numbers.
 * @param {number} a Number 1.
 * @param {number} b Number 2.
 * @returns {number} Least common multiple.
 */
export function leastCommonMultiple(a, b) {
  return a * b / greatestCommonDivisor(a, b);
}

/**
 * Calculates the greatest common divisor of two numbers.
 * @param {number} a Number 1.
 * @param {number} b Number 2.
 * @returns {number} Greatest common divisor.
 */
export function greatestCommonDivisor(a, b) {
  return b == 0 ? a : greatestCommonDivisor (b, a % b);
}