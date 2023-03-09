type ClassModel = {
  name: string;
  active?: boolean;
  books?: Array<string>;
  students: Array<string>;
};

type ChallengeResultComplexModel = {
  correct: boolean;
  "wrong-code"?: string;
  "wrong-date"?: string;
  "correct-code"?: string;
  "correct-date"?: string;
  id?: string;
  student?: string;
  title?: string;
};

type ChallengeResultModel = boolean | ChallengeResultComplexModel;

type ResultsModel = {
  user: string;
  book: string;
  //results?: Map<string, ChallengeResultModel>;
  // and all the other fields are string keys
};

export {
  ClassModel,
  ResultsModel,
  ChallengeResultModel,
  ChallengeResultComplexModel,
};
