class NotFoundError extends Error {
  public toString = (): string => {
    return `404: not found (${this.message})`;
  };
}

export default NotFoundError;
