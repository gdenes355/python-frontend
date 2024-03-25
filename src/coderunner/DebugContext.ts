type DebugContext = {
  lineno: number;
  locals: Map<string, string>;
  globals: Map<string, string>;
  watches: Map<string, string>;
};

const emptyDebugContext: DebugContext = {
  lineno: 0,
  locals: new Map(),
  globals: new Map(),
  watches: new Map(),
};

export default DebugContext;
export { emptyDebugContext };
