/**
 * Matrix class.
 */
export class Matrix {
  /**
   * @param {number[][]} data Matrix data.
   */
  constructor(data) {
    /**
     * Matrix data.
     * @type {number[][]}
     */
    this.data = data.map(row => row.slice());
    /**
     * Number of rows.
     * @type {number}
     */
    this.numberOfRows = data.length;
    /**
     * Number of columns.
     * @type {number}
     */
    this.numberOfColumns = data.length == 0 ? 0 : data[0].length;
  }

  /**
   * Clones the matrix.
   * @returns {Matrix} Copy of the matrix.
   */
  clone() {
    return new Matrix(this.data);
  }

  /**
   * Calculates the matrix determinant.
   * @returns {number} Matrix determinant (undefined for a non-square or an empty matrix).
   */
  determinant() {
    if (this.numberOfRows * this.numberOfColumns == 0 || this.numberOfRows != this.numberOfColumns)
      return undefined;
    
    if (this.numberOfRows == 1)
      return this.data[0][0];

    let determinant = typeof(this.data[0][0]) == "bigint" ? 0n : 0;
    let one = typeof(this.data[0][0]) == "bigint" ? 1n : 1;

    for (let c = 0; c < this.numberOfColumns; c++)
      determinant += ((c % 2 == 0) ? one : -one) * this.data[0][c] * this.clone().removeRow(0).removeColumn(c).determinant();
    return determinant;
  }

  /**
   * Modifies the matrix by removing a row.
   * @param {number} rowIndex Row index.
   * @returns {Matrix} Modified matrix.
   */
  removeRow(rowIndex) {
    this.data.splice(rowIndex, 1);
    this.numberOfRows--;
    return this;
  }

  /**
   * Modifies the matrix by removing a column.
   * @param {number} columnIndex Column index.
   * @returns {Matrix} Modified matrix.
   */
  removeColumn(columnIndex) {
    for (let row of this.data)
      row.splice(columnIndex, 1);
    this.numberOfColumns--;
    return this;
  }
}