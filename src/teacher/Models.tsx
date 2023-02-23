type ClassModel = {
  name: string;
  active?: boolean;
  books?: Array<string>;
  students: Array<string>;
};

type ChallengeResultComplexModel = {
  correct: boolean;
  //wrong-code?: string;
  //wrong-date?: Date;
  //correct-code?: string;
  //correct-date?: Date;
};

type ChallengeResultModel = boolean | ChallengeResultComplexModel;

type ResultsModel = {
  user: string;
  book: string;
  results?: Map<string, ChallengeResultModel>;
  // and all the other fields are
};

export {
  ClassModel,
  ResultsModel,
  ChallengeResultModel,
  ChallengeResultComplexModel,
};
