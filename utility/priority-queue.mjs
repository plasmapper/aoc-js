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
    this.#heapifyUp(this.heap.length - 1);
  }

  /**
   * Dequeues element.
   * @returns {*} value Element value.
   */
  dequeue() {
    let value = this.heap[0].value;
    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.pop();
    this.#heapifyDown(0);
    return value;
  }

  /**
   * Returns the size of the priority queue.
   * @returns {number} Priority queue size.
   */
  getSize() {
    return this.heap.length;
  }

  /**
   * Changes the priority of the queue element.
   * @param {*} value Element value.
   * @param {number} newPriority New priority.
   */
  changePriority(value, newPriority) {
    let index = this.heap.findIndex(e => e.value == value);
    if (index < 0)
      throw new Error("Value not found in the queue");
    let oldPriority = this.heap[index].priority;
    this.heap[index].priority = newPriority;
    if (newPriority < oldPriority)
      this.#heapifyUp(index);
    if (newPriority > oldPriority)
      this.#heapifyDown(index);
  }

  /**
   * Moves the element at the specified index to the correct position up.
   * @param {*} index 
   */
  #heapifyUp(index) {
    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].priority >= this.heap[parentIndex].priority)
        return;
      let element = this.heap[index];
      this.heap[index] = this.heap[parentIndex];
      this.heap[parentIndex] = element;
      index = parentIndex;
    }
  }

  /**
   * Moves the element at the specified index to the correct position down.
   * @param {*} index 
   */
  #heapifyDown(index) {
    while (true) {
      let childIndex = index * 2 + 1;
      if (childIndex >= this.heap.length)
        return;
      if (childIndex + 1 < this.heap.length && this.heap[childIndex + 1].priority < this.heap[childIndex].priority)
        childIndex++;
      if (this.heap[index].priority <= this.heap[childIndex].priority)
        return;
      let element = this.heap[index];
      this.heap[index] = this.heap[childIndex];
      this.heap[childIndex] = element;
      index = childIndex;
    }
  }
}
  
/**
 * Priority queue element class.
 */
class PriorityQueueElement {
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