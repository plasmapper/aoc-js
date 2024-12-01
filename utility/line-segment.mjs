import { Vector2D } from "./vector.mjs"

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