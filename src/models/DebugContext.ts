type DebugContext = {
  lineno: number;
  locals: Map<string, string>;
  globals: Map<string, string>;
};

export default DebugContext;
