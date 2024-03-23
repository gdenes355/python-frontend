class Event<T, R = void> {
  register(callback: (data: T) => R) {
    const id = this.nextId++;
    this.listeners.set(id, callback);
    return id;
  }

  unregister(id: number) {
    this.listeners.delete(id);
  }

  fire(data: T) {
    this.listeners.forEach((callback) => callback(data));
  }

  private listeners: Map<number, (data: T) => R> = new Map();
  private nextId = 0;
}

class AsyncEvent<T, R = void> {
  register(callback: (data: T) => Promise<R>) {
    const id = this.nextId++;
    this.listeners.set(id, callback);
    return id;
  }

  unregister(id: number) {
    this.listeners.delete(id);
  }

  // when firing this async event, return the first sensible result from any of the handlers
  async fire(data: T) {
    let res = await Promise.all(
      Array.from(this.listeners.values()).map((callback) => callback(data))
    );
    res = res.filter((r) => !!r);
    if (!res.length) return;
    return res[0];
  }

  private listeners: Map<number, (data: T) => Promise<R>> = new Map();
  private nextId = 0;
}

export default Event;
export { AsyncEvent };
