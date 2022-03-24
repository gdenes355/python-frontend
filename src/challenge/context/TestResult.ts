type TestResult = {
    outcome: boolean,
    err: string,
    expected: string,
    actual: string
    ins: string
};

type TestResults = Array<TestResult>;

export {TestResult, TestResults}
