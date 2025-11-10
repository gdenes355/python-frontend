import { useCallback, useEffect, useRef, useState } from "react";
import {
  AggregatedResultsModel,
  ChallengeResultComplexModel,
  ClassModel,
  ResultsModel,
} from "../Models";
import { ChallengeInfo } from "../components/ResultsTableRow";

const processResults = (
  aClass?: ClassModel,
  results?: ResultsModel[],
  challengeInfo?: ChallengeInfo
) => {
  if (!results || !aClass || !challengeInfo || results.length === 0) {
    return {
      aggregatedResults: new Map<string, AggregatedResultsModel>(),
      studentIdsByPassCount: [] as string[],
    };
  }
  const today = new Date().toISOString().split("T")[0];

  const newAggregatedResults = new Map(
    aClass.students.map((student) => {
      let res = results?.length
        ? results?.filter((r) => r.user === student).at(0)
        : null;
      let passCount: number | undefined = undefined;
      const challengeIdsAttemptedToday = new Set<string>();
      if (res && challengeInfo) {
        passCount = 0;
        for (let id of challengeInfo.ids) {
          let r = (res as any)[id] as any;
          if (r instanceof Boolean) {
            // TODO: deprecate old boolean results
            challengeIdsAttemptedToday.add(id);
            if (r as boolean) {
              passCount++;
            }
          } else {
            const rAsComplex = r as ChallengeResultComplexModel;
            if (rAsComplex?.correct) {
              passCount++;
            }
            if (
              (rAsComplex?.["correct-date"] &&
                rAsComplex?.["correct-date"] > today) ||
              (rAsComplex?.["wrong-date"] && rAsComplex?.["wrong-date"] > today)
            ) {
              challengeIdsAttemptedToday.add(id);
            }
          }
        }
      }

      return [
        student,
        {
          student: student,
          results: res as ResultsModel | undefined,
          passCount: passCount,
          challengeIdsAttemptedToday: challengeIdsAttemptedToday,
        },
      ];
    })
  );
  // computed ordered array of student ids by passCount
  const studentIdsByPassCount = Array.from(newAggregatedResults.keys()).sort(
    (a, b) => {
      return (
        (newAggregatedResults.get(b)?.passCount || 0) -
        (newAggregatedResults.get(a)?.passCount || 0)
      );
    }
  );
  return { aggregatedResults: newAggregatedResults, studentIdsByPassCount };
};

const areStudentResultIdsTheSame = (a: string[], b: string[]) => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

// hook to aggregate student results.
// only triggers when at least the order of students changes.
const useAggregatedResults = (
  results?: ResultsModel[],
  klass?: ClassModel,
  challengeInfo?: ChallengeInfo,
  onInvalidateRowOnly?: (student: string, id?: string) => void
) => {
  const [aggregatedResults, setAggregatedResults] = useState<
    Map<string, AggregatedResultsModel>
  >(new Map());

  const aggregatedResultsRef = useRef<Map<string, AggregatedResultsModel>>(
    new Map()
  );

  const studentIdsByPassCountRef = useRef<string[]>([]);

  // var to state by in place update, so the data is up-to-date without propagating the change
  const updateAggregatedResultsInPlace = (
    newResults: Map<string, AggregatedResultsModel>,
    newStudentIdsByPassCount: string[]
  ) => {
    aggregatedResultsRef.current = newResults;
    studentIdsByPassCountRef.current = newStudentIdsByPassCount;
    for (const [student, entry] of newResults.entries()) {
      aggregatedResults.set(student, entry);
    }
  };

  // var to state by replacement
  const updateAggregatedResultsByReplacement = useCallback(
    (
      newResults: Map<string, AggregatedResultsModel>,
      newStudentIdsByPassCount: string[]
    ) => {
      aggregatedResultsRef.current = newResults;
      studentIdsByPassCountRef.current = newStudentIdsByPassCount;
      setAggregatedResults(new Map([...newResults]));
    },
    []
  );

  const updateAggregatedResultsInternal = (
    targetStudent?: string,
    targetId?: string
  ) => {
    const {
      aggregatedResults: newAggregatedResults,
      studentIdsByPassCount: newStudentIdsByPassCount,
    } = processResults(klass, results, challengeInfo);
    if (newAggregatedResults.size === 0) {
      updateAggregatedResultsByReplacement(
        newAggregatedResults,
        newStudentIdsByPassCount
      );
    } else if (
      newAggregatedResults.size !== aggregatedResultsRef.current.size
    ) {
      // different number of students
      updateAggregatedResultsByReplacement(
        newAggregatedResults,
        newStudentIdsByPassCount
      );
    } else if (
      Object.entries(aggregatedResultsRef.current).filter(
        ([student, _]) => !newAggregatedResults.has(student)
      ).length > 0
    ) {
      // same number of students, but some students are missing (so it's not a perfect overlap)
      updateAggregatedResultsByReplacement(
        newAggregatedResults,
        newStudentIdsByPassCount
      );
    } else if (
      !areStudentResultIdsTheSame(
        studentIdsByPassCountRef.current,
        newStudentIdsByPassCount
      )
    ) {
      // different order

      updateAggregatedResultsByReplacement(
        newAggregatedResults,
        newStudentIdsByPassCount
      );
    } else {
      updateAggregatedResultsInPlace(
        newAggregatedResults,
        newStudentIdsByPassCount
      );
      if (targetStudent) {
        onInvalidateRowOnly?.(targetStudent, targetId);
      }
    }
  };

  const updateAggregatedResultsRef = useRef<
    (targetStudent?: string, targetId?: string) => void
  >(updateAggregatedResultsInternal);
  updateAggregatedResultsRef.current = updateAggregatedResultsInternal;

  const updateAggregatedResults = useCallback(
    (targetStudent?: string, targetId?: string) => {
      return updateAggregatedResultsRef.current(targetStudent, targetId);
    },
    []
  );

  // listen to updated props
  useEffect(() => {
    const {
      aggregatedResults: newAggregatedResults,
      studentIdsByPassCount: newStudentIdsByPassCount,
    } = processResults(klass, results, challengeInfo);
    updateAggregatedResultsByReplacement(
      newAggregatedResults,
      newStudentIdsByPassCount
    );
  }, [results, klass, challengeInfo, updateAggregatedResultsByReplacement]);

  const getAggregateResultsFromRef = useCallback(
    (student: string) => {
      return aggregatedResultsRef.current?.get(student);
    },
    [aggregatedResultsRef]
  );

  return {
    aggregatedResults,
    updateAggregatedResults,
    getAggregateResultsFromRef,
  };
};

export default useAggregatedResults;
