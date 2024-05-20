type ClassModel = {
  name: string;
  active?: boolean;
  books?: Array<string>;
  join_code?: string;
  disabled_books?: Array<string>;
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
  name?: string;
};

type ChallengeResultModel = boolean | ChallengeResultComplexModel;

type ResultsModel = {
  user: string;
  name: string;
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
