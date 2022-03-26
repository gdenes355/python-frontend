type TestCase = {
  in: string;
  out: string;
};

type TestCases = Array<TestCase>;

type TestResult = {
  outcome: boolean;
  err: string;
  expected: string;
  actual: string;
  ins: string;
};

type TestResults = Array<TestResult>;

type AllTestResults = {
  passed: Set<string>;
  failed: Set<String>;
};

export { TestCase, TestCases, TestResult, TestResults, AllTestResults };
