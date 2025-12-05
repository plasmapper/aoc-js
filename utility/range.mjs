import { Vector2D } from "./vector.mjs"

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
    ranges = ranges.slice().sort((r1, r2) => r1.from < r2.from ? -1 : (r1.from > r2.from ? 1 : 0));
    let newRanges = [ranges[0]];
    for (let range of ranges) {
      let lastNewRange = newRanges[newRanges.length - 1];
      if (range.from <= lastNewRange.to)
        lastNewRange.to = range.to > lastNewRange.to ? range.to : lastNewRange.to;
      else
        newRanges.push(range);
    }
    return newRanges;
  }
}

/**
 * 2D range class.
 */
export class Range2D {
  /**
   * @param {number} xFrom X range start.
   * @param {number} xTo X range end.
   * @param {number} yFrom Y range start.
   * @param {number} yTo Y range end.
   */
  constructor (xFrom, xTo, yFrom, yTo) {
    /**
     * X range.
     * @type {Range}
     */
    this.x = new Range(xFrom, xTo);
    /**
     * Y range.
     * @type {Range}
     */
    this.y = new Range(yFrom, yTo);
  }

  /**
   * Clones the range.
   * @returns {Range2D} Copy of the range.
   */
  clone() {
    return new Range2D(this.x.from, this.x.to, this.y.from, this.y.to);
  }

  /**
   * Returns true if the 2D vector is inside the range.
   * @param {Vector2D} vector Vector.
   * @returns {boolean} True if the vector is inside the range.
   */
  contains(vector) {
    return this.x.contains(vector.x) && this.y.contains(vector.y);
  }
}