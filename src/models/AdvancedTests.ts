type AdvancedTestCaseMatch = {
  typ: "+" | "-";
  match: string;
  ignore?: string;
  multi?: number;
}

type AdvancedTestCase = {
  in: Array<string>;
  out: Array<AdvancedTestCaseMatch>;
};

type AdvancedTestCases = Array<AdvancedTestCase>;

export { AdvancedTestCase, AdvancedTestCases};
