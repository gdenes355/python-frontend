type TestCase = {
  in: string | Array<string | number>;
  out: string;
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
