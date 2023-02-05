enum ChallengeStatus {
  LOADING = 0,
  INITIALISING,
  RESTARTING_WORKER,
  READY,
  AWAITING_INPUT,
  ON_BREAKPOINT,
  RUNNING,
}

export default ChallengeStatus;
