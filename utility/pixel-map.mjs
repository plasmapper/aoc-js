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
    const maxMapScreenHeight = 600;

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
      this.container.style.width = this.container.width + "px";
      this.container.style.height = this.container.height + "px";
      this.context = this.container.getContext("2d");
    }
  }

  /**
   * Clears the pixel map.
   */
  clear() {
    if (typeof this.context !== "undefined")
      this.context.clearRect(0, 0, this.width * this.pixelSize, this.height * this.pixelSize);

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++)
        this.image[y][x] = 0;
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