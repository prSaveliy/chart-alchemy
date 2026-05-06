type PriorityQueueEntry<T> = {
  item: T;
  priority: number;
  order: number;
};

export class PriorityQueue<T> {
  private items: PriorityQueueEntry<T>[] = [];
  private insertionCounter = 0;

  get size() {
    return this.items.length;
  }

  get isEmpty() {
    return this.items.length === 0;
  }

  enqueue(item: T, priority: number) {
    this.items.push({
      item,
      priority,
      order: this.insertionCounter++,
    });
  }

  peek() {
    if (this.isEmpty) return undefined;
    return this.items[this.findHighestPriorityIndex()].item;
  }

  dequeue() {
    if (this.isEmpty) return undefined;

    const index = this.findHighestPriorityIndex();
    const [entry] = this.items.splice(index, 1);

    return entry.item;
  }

  clear() {
    this.items = [];
    this.insertionCounter = 0;
  }

  private findHighestPriorityIndex() {
    return this.items.reduce((bestIndex, entry, index) => {
      const bestEntry = this.items[bestIndex];

      if (entry.priority > bestEntry.priority) {
        return index;
      }

      if (entry.priority === bestEntry.priority && entry.order < bestEntry.order) {
        return index;
      }

      return bestIndex;
    }, 0);
  }
}
