import {
  IconButton,
  Skeleton,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useMemo, useState } from "react";
import BookNodeModel, {
  extractIdsWithTestsInOrder,
  extractIds,
} from "../models/BookNodeModel";
import {
  ClassModel,
  ResultsModel,
  ChallengeResultModel,
  ChallengeResultComplexModel,
} from "./Models";
import SelectAllIcon from "@mui/icons-material/SelectAll";

import "./ResultsTable.css";

type ResultsTableProps = {
  group?: ClassModel;
  bookTitle?: string;
  book?: BookNodeModel;
  results?: Array<ResultsModel>;
  onResultsSelected: (res: ChallengeResultComplexModel[]) => void;
  onResultSelected: (res: ChallengeResultComplexModel) => void;
  onResultAdd: (res: ChallengeResultComplexModel) => void;
};

type ChallengeInfo = {
  ids: Array<string>;
  map: Map<string, BookNodeModel>;
};

type ResultsTableRowProps = {
  student: string;
  results?: Array<ResultsModel>;
  challengeInfo?: ChallengeInfo;
  onResultSelected: (
    res: ChallengeResultComplexModel,
    withShift: boolean,
    withAlt: boolean
  ) => void;
  onResultsSelected: (res: ChallengeResultComplexModel[]) => void;
};

const resultFromId = (
  id: string,
  myResults: ResultsModel,
  student: string,
  challengeInfo?: ChallengeInfo
) => {
  let res = (myResults as any)[id];
  if (res === undefined) return undefined;
  if (res === true || res === false) {
    return {
      correct: res as boolean,
      id,
      student: student,
      title: challengeInfo?.map.get(id)?.name,
    };
  } else {
    let resc = res as ChallengeResultComplexModel;
    resc.student = student;
    resc.id = id;
    resc.title = challengeInfo?.map.get(id)?.name;
    return resc;
  }
};

const ResultsTableRow = (props: ResultsTableRowProps) => {
  const [myResults, setMyResults] = useState<ResultsModel | undefined>(
    undefined
  );
  const [hasResults, setHasResults] = useState<boolean | undefined>(undefined);

  const correctCount = useMemo(() => {
    if (!myResults || !props.challengeInfo?.ids) return undefined;
    let count = 0;

    props.challengeInfo.ids.forEach((id) => {
      let r = (myResults as any)[id] as any;
      if (
        (r instanceof Boolean && (r as boolean)) ||
        (r as ChallengeResultComplexModel)?.correct
      ) {
        count++;
      }
    });
    return count;
  }, [myResults, props.challengeInfo]);

  useEffect(() => {
    if (!props.results?.length) {
      setMyResults(undefined);
      setHasResults(undefined);
      return;
    }
    for (const res of props.results) {
      if (res.user === props.student) {
        setMyResults(res);
        setHasResults(true);
        return;
      }
    }
    setHasResults(false);
  }, [props.results, props.student]);

  const resultToCode = (
    outcome: boolean,
    hasSeenCorrect: boolean,
    hasSeenWrong: boolean
  ) => {
    if (outcome === false) return -1;
    if (outcome === undefined) return 0;
    if (outcome === true && hasSeenWrong) return 1;
    return 2;
  };

  const passed = (id: string) => {
    let res = (
      myResults ? (myResults as any)[id] : undefined
    ) as ChallengeResultModel;
    if (res === undefined) {
      return 0;
    }

    // we might be able to retire the instanceof selector later
    if (res === true || res === false) {
      return resultToCode(res as boolean, false, false);
    } else {
      let resc = res as ChallengeResultComplexModel;
      return resultToCode(
        resc.correct,
        !!resc["correct-date"],
        !!resc["wrong-date"]
      );
    }
  };

  const StyledResCell = useMemo(
    () =>
      styled("span")(
        ({ theme }) => `
  width: ${100 / (props.challengeInfo?.ids.length || 10)}%;
  `
      ),
    [props.challengeInfo?.ids]
  );

  const onIndividialResultClicked = (e: React.MouseEvent, id: string) => {
    if (!myResults) return;
    let res = resultFromId(id, myResults, props.student, props.challengeInfo);
    if (res === undefined) return;
    props.onResultSelected(res, e.shiftKey, e.altKey);
  };

  const selectAllResults = () => {
    if (!myResults) return;
    let results: ChallengeResultComplexModel[] = [];
    for (let id of props.challengeInfo?.ids || []) {
      let res = resultFromId(id, myResults, props.student, props.challengeInfo);
      if (res) {
        results.push(res);
      }
    }
    props.onResultsSelected(results);
  };

  return (
    <TableRow>
      <TableCell>{props.student}</TableCell>
      <TableCell>
        {correctCount || "?"}/{props.challengeInfo?.ids?.length}
      </TableCell>
      <TableCell>
        <div className="res-container">
          {hasResults === true && props.challengeInfo ? (
            props.challengeInfo?.ids?.map((id) => {
              let p = passed(id);
              return (
                <Tooltip
                  key={id}
                  className={" res res-" + p}
                  title={props.challengeInfo?.map.get(id)?.name}
                  onClick={(e) => onIndividialResultClicked(e, id)}
                >
                  <StyledResCell />
                </Tooltip>
              );
            })
          ) : hasResults === undefined || !props.challengeInfo ? (
            <Skeleton
              animation="wave"
              sx={{ width: "100%" }}
              variant="rectangular"
            />
          ) : (
            <span>no results</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <IconButton
          size="small"
          sx={{ padding: "0px" }}
          onClick={(e) => selectAllResults()}
        >
          <SelectAllIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

const ResultsTable = (props: ResultsTableProps) => {
  const [challengeInfo, setChallengeInfo] = useState<ChallengeInfo | undefined>(
    undefined
  );

  useEffect(() => {
    if (!props.book) {
      setChallengeInfo(undefined);
      return;
    }

    let ids = extractIdsWithTestsInOrder(props.book);
    let map = extractIds(props.book);
    setChallengeInfo({ ids, map });
  }, [props.book]);

  if (!props.group) {
    return <p>Please pick a group to display results.</p>;
  }

  if (!props.bookTitle) {
    return <p>Please pick a book to display results.</p>;
  }

  const onResultSelected = (
    res: ChallengeResultComplexModel,
    shift: boolean,
    alt: boolean
  ) => {
    if (!res.id) return;
    if (!alt) {
      if (!shift) props.onResultSelected(res);
      else props.onResultAdd(res);
    } else {
      // alt means we picked this column
      let ress: ChallengeResultComplexModel[] = [];
      for (let ares of props.results || []) {
        let aresT = resultFromId(res.id, ares, ares.user, challengeInfo);
        if (aresT) {
          ress.push(aresT);
        }
      }
      ress.sort((a, b) => a.student?.localeCompare(b.student || "") || 0);
      props.onResultsSelected(ress);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <TableContainer>
        <Table size="small">
          <colgroup>
            <col style={{ width: "5%" }} />
            <col style={{ width: "50px" }} />
            <col></col>
            <col style={{ width: "20px" }}></col>
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell></TableCell>
              <TableCell>Breakdown</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {props.group.students.sort().map((student) => {
              return (
                <ResultsTableRow
                  key={student}
                  student={student}
                  challengeInfo={challengeInfo}
                  results={props.results}
                  onResultSelected={onResultSelected}
                  onResultsSelected={props.onResultsSelected}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ResultsTable;
