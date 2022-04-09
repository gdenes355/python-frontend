type ParsonsWidgetOptions = {
  sortableId: string;
  trashId: string;
  incorrectSound?: boolean;
  x_indent?: number;
  can_indent?: boolean;
  feedback_cb?: boolean;
  first_error_only?: boolean;
  max_wrong_lines?: number;
  lang?: "en" | "fi";
  toggleSeparator?: string;
};

interface ParsonsWidget {
  constructor(options: ParsonsWidgetOptions);

  options: ParsonsWidgetOptions;

  // Parses an assignment definition given as a string and returns and
  // transforms this into an object defining the assignment with line objects.
  //
  // lines: A string that defines the solution to the assignment and also
  //   any possible distractors
  // max_distractrors: The number of distractors allowed to be included with
  //   the lines required in the solution
  parseCode(lines: string[], max_distractors: number);

  init(text: string);
  getHash(searchString: string);
  solutionHash();
  whatWeDidPreviously();
  addLogEntry();
  getLineById(id: string);

  /**
   * Update indentation of a line based on new coordinates
   * leftDiff horizontal difference from (before and after drag) in px
   ***/
  updateIndent(leftDiff: number, id: string): number;

  normalizeIndents(lines: string[]);
  _codelinesAsString(): string;
  getModifiedCode(search_string: string);
  hashToIDList(hash: string);
  updateIndentsFromHash(hash: string);
  getFeedback(): string;
  colorFeedback(elemId: string);
  clearFeedback();
  displayError(message: string);
  shuffleLines();
  getRandomPermutation();
  createHTMLFromHashes();
  updateHTMLIndent();
  codeLineToHTML();
  createHTMLFromLists();
}

export default ParsonsWidget;
