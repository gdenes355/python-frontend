type Item<T> = (t: T | null) => Promise<T | null>;

class AsyncQueue<T> {
  public reset(method: () => Promise<T>) {
    this.queue = []; // clear queue
    this.resetting = true;
    let chainSeq = ++this.activeExecChainSeq;
    this.activePromise = method();
    this.activePromise.then((t) => this.itemCallback(t, chainSeq));
  }

  public isFresh() {
    return this.isResetting() || this.hasJustReset();
  }

  public isResetting() {
    return this.resetting;
  }

  public hasJustReset() {
    return this.justReset;
  }

  public isInitialised() {
    return this.initialised;
  }

  public addItem(item: Item<T>) {
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
    this.activePromise = front(this.t);
    this.activePromise.then((t) => this.itemCallback(t, chainSeq));
  }

  private itemCallback(t: T | null, chainSeq: number) {
    if (!t) {
      // we have lost the target object
      return;
    }
    if (chainSeq !== this.activeExecChainSeq) {
      // this is a callback from a stale exec chain. The queue has been since reset
      return;
    }
    if (this.justReset) {
      this.justReset = false;
    }
    if (this.resetting) {
      this.resetting = false;
      this.justReset = true;
      this.initialised = true;
    }

    this.resetting = false;
    this.t = t;
    this.activePromise = null;
    this.schedulePromise(chainSeq);
  }

  private queue: Array<Item<T>> = [];
  private activePromise: Promise<T | null> | null = null;
  private activeExecChainSeq: number = -1; // gets incremented after every reset, so stale async queues are not maintained
  private t: T | null = null;
  private resetting: boolean = false;
  private justReset: boolean = false;
  private initialised: boolean = false;
}

export default AsyncQueue;
