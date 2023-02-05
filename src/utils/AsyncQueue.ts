type Item = () => Promise<undefined>;

class AsyncQueue {
  public reset() {
    this.queue = []; // clear queue
    this.activeExecChainSeq++;
    this.activePromise = null;
  }

  public isInitialised() {
    return this.initialised;
  }

  public addItem(item: Item) {
    this.queue.push(item);
    if (!this.activePromise) {
      this.schedulePromise(this.activeExecChainSeq);
    }
  }

  private schedulePromise(chainSeq: number) {
    let front = this.queue.shift();
    if (!front) {
      return;
    }
    this.activePromise = front();
    this.activePromise.then(() => this.itemCallback(chainSeq));
  }

  private itemCallback(chainSeq: number) {
    if (chainSeq !== this.activeExecChainSeq) {
      // this is a callback from a stale exec chain. The queue has been since reset
      return;
    }
    this.activePromise = null;
    this.schedulePromise(chainSeq);
  }

  private queue: Array<Item> = [];
  private activePromise: Promise<undefined> | null = null;
  private activeExecChainSeq: number = -1; // gets incremented after every reset, so stale async queues are not maintained
  private initialised: boolean = false;
}

export default AsyncQueue;
