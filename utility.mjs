export * from "./utility/console.mjs";
export * from "./utility/graph.mjs";
export * from "./utility/line-segment.mjs";
export * from "./utility/matrix.mjs";
export * from "./utility/pixel-map.mjs";
export * from "./utility/priority-queue.mjs";
export * from "./utility/range.mjs";
export * from "./utility/renderer.mjs";
export * from "./utility/vector.mjs";

import { Matrix } from "./utility/matrix.mjs";

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

/**
 * Solves the system of linear equations.
 * @param {number[][]} coefficients Equations coefficients (e.g. for x + y = 10, x - y = 4: [[1, 1, 10], [1, -1, 4]]).
 * @returns {number[]} Solution as an array of variable values.
 */
export function linearSystemSolution(coefficients) {
  let solution = [];
  let size = coefficients.length;

  let denominator = new Matrix(coefficients).removeColumn(size).determinant();

  for (let i = 0; i < size; i++) {
    let matrix = new Matrix(coefficients);
    for (let j = 0; j < size; j++)
      matrix.data[j][i] = matrix.data[j][size];
    solution.push(matrix.removeColumn(size).determinant() / denominator);
  }

  return solution;
}