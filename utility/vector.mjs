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
   * Modifies the vector by dividing it by a scalar.
   * @param {number} scalar Scalar to divide the vector by.
   * @returns {Vector2D} Modified vector.
   */
  divide(scalar) {
    this.x /= scalar;
    this.y /= scalar;
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
   * Modifies the vector by dividing it by a scalar.
   * @param {number} scalar Scalar to divide the vector by.
   * @returns {Vector3D} Modified vector.
   */
  divide(scalar) {
    this.x /= scalar;
    this.y /= scalar;
    this.z /= scalar;
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
    return new Vector3D(this.y * vector.z - this.z * vector.y, this.z * vector.x - this.x * vector.z, this.x * vector.y - this.y * vector.x);
  }
}