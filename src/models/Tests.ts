type AdvancedOutRequirement = {
  /** pattern to check for */
  pattern: string;

  /**
   * +: contains, - does not contain
   * c+: code contains, c- code does not contain
   * f+: file contains, f- file does not contain
   * s+: when statement runs, the output contains, s- when statement runs, the output does not contain
   * t: turtle
   * default is +, contains
   */
  typ?: "+" | "-" | "c+" | "c-" | "f+" | "f-" | "s+" | "s-" | "t";

  /**
   * w: whitespace insensitive
   * c: case insensitive
   * p: punctuation insensitive
   * wc: whitespace and case insensitive
   * wp: whitespace and punctuation insensitive
   * cp: case and punctuation insensitive
   * wcp: whitespace, case and punctuation insensitive
   * "": exact match
   * default is "", exact match
   */
  ignore?: "" | "w" | "c" | "p" | "wc" | "wp" | "cp" | "wcp";

  /**
   * if count is specified, the pattern must appear count times. default is *-1, don't care*
   */
  count?: number;

  /**
   * file to test. Only used if typ is f+ or f-
   */
  filename?: string;

  /**
   * statement to test. Only used if typ is s+ or s-
   */
  statement?: string;

  /**
   * regex: if true, pattern is a regular expression. default is true (!)
   */
  regex?: boolean;
};

type TestCase = {
  in: string | Array<string | number>;
  out: string | Array<AdvancedOutRequirement>;
};

type TestCases = Array<TestCase>;

type TestResult = {
  outcome: boolean;
  err?: string;
  expected?: string | Array<AdvancedOutRequirement>;
  criteriaOutcomes?: Array<boolean>;
  actual?: string;
  ins?: string | Array<string | number>;
};

type TestResults = Array<TestResult>;

type AllTestResults = {
  passed: Set<string>;
  failed: Set<string>;
};

export { TestCase, TestCases, TestResult, TestResults, AllTestResults };
