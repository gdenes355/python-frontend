type AdvancedOutRequirement = {
  pattern: string;
  typ?: "+" | "-";
  ignore?: "" | "w" | "c" | "p" | "wc" | "wp" | "cp" | "wcp";
  count?: number;
};

type TestCase = {
  in: string | Array<string | number>;
  out: string | Array<AdvancedOutRequirement>;
};

type TestCases = Array<TestCase>;

type TestResult = {
  outcome: boolean;
  err?: string;
  expected?: string;
  actual?: string;
  ins?: string;
};

type TestResults = Array<TestResult>;

type AllTestResults = {
  passed: Set<string>;
  failed: Set<string>;
};

export { TestCase, TestCases, TestResult, TestResults, AllTestResults };
