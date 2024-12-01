/**
 * Priority queue class.
 */
export class PriorityQueue {
  constructor() {
    /**
     * Element heap.
     * @type {PriorityQueueElement[]}
     */
    this.heap = [];
  }

  /**
   * Enqueues element.
   * @param {*} value Element value.
   * @param {number} priority Element priority (lower number is higher priority).
   */
  enqueue(value, priority) {
    this.heap.push(new PriorityQueueElement(value, priority));
    
    let childIndex = this.heap.length - 1;
    while (childIndex > 0) {
      let parentIndex = Math.floor((childIndex - 1) / 2);
      if (this.heap[childIndex].priority >= this.heap[parentIndex].priority)
        break;
      let element = this.heap[childIndex];
      this.heap[childIndex] = this.heap[parentIndex];
      this.heap[parentIndex] = element;
      childIndex = parentIndex;
    }
  }

  /**
   * Dequeues element.
   * @returns {*} value Element value.
   */
  dequeue() {
    let value = this.heap[0].value;
    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.pop();

    let parentIndex = 0;

    while (true) {
      let childIndex = parentIndex * 2 + 1;
      if (childIndex >= this.heap.length)
        break;
      if (childIndex + 1 < this.heap.length && this.heap[childIndex + 1].priority < this.heap[childIndex].priority)
        childIndex++;
      if (this.heap[parentIndex].priority <= this.heap[childIndex].priority)
        break;
      let element = this.heap[parentIndex];
      this.heap[parentIndex] = this.heap[childIndex];
      this.heap[childIndex] = element;
      parentIndex = childIndex;
    }

    return value;
  }

  /**
   * Returns the size of the priority queue.
   * @returns {number} Priority queue size.
   */
  getSize() {
    return this.heap.length;
  }
}
  
/**
 * Priority queue element class.
 */
export class PriorityQueueElement {
  /**
   * @param {*} value Element value.
   * @param {number} priority Element priority (lower number is higher priority).
   */
  constructor(value, priority) {
    /**
     * Element value.
     * @type {*}
     */
    this.value = value;
    /**
     * Element priority (lower number is higher priority).
     * @type {number}
     */
    this.priority = priority;
  }
}