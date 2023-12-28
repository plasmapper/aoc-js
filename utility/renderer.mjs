import { Vector3D } from "./vector.mjs"

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