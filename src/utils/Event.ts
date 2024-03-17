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

  async fire(data: T) {
    await Promise.all(
      Array.from(this.listeners.values()).map((callback) => callback(data))
    );
  }

  private listeners: Map<number, (data: T) => Promise<R>> = new Map();
  private nextId = 0;
}

export default Event;
export { AsyncEvent };
