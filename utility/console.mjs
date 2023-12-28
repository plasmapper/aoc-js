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