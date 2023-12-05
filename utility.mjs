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
   * @param {HTMLCanvasElement} canvas HTML canvas.
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
    this.pixelSize = Math.min(Math.floor(maxMapScreenWidth / this.width), Math.floor(maxMapScreenHeight / this.height));
    /**
     * Color palette.
     * @type {string[]}
     */
    this.palette = [];

    this.image = [];
    for (let y = 0; y < this.height; y++)
      this.image.push(new Array(this.width).fill(0));

    if (typeof document !== "undefined") {
      this.container = document.createElement("canvas");;
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
   * @param {number} colorIndex color.
   */
  drawPixel(x, y, colorIndex) {
    this.image[y][x] = colorIndex;

    if (typeof this.context !== "undefined") {
      this.context.fillStyle = this.palette[colorIndex];
      this.context.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
    }
  }

  /**
   * Clears a single pixel.
   * @param {number} x X coordinate.
   * @param {number} y Y coordinate.
   */
  clearPixel(x, y) {
    this.image[y][x] = 0;

    if (typeof this.context !== "undefined")
      this.context.clearRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
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
   * Clones the vector.
   * @returns {Vector2D} Copy of the vector.
   */
  clone() {
    return new Vector2D(this.x, this.y);
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
    return new Vector2D(this.x * vector.x + this.y * vector.y);
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