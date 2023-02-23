import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useState } from "react";
import BookNodeModel, {
  extractIdsWithTestsInOrder,
} from "../models/BookNodeModel";
import { ClassModel, ResultsModel, ChallengeResultModel } from "./Models";

import "./ResultsTable.css";

type ResultsTableProps = {
  group?: ClassModel;
  bookTitle?: string;
  book?: BookNodeModel;
  results?: Array<ResultsModel>;
};

type ResultsTableRowProps = {
  student: string;
  results?: Array<ResultsModel>;
  challengeIds?: Array<string>;
};

const ResultsTableRow = (props: ResultsTableRowProps) => {
  const [myResults, setMyResults] = useState<ResultsModel | undefined>(
    undefined
  );
  useEffect(() => {
    if (!props.results) {
      setMyResults(undefined);
      return;
    }
    for (const res of props.results) {
      if (res.user === props.student) {
        setMyResults(res);
        return;
      }
    }
    return undefined;
  }, [props.results, props.student]);

  const passed = (id: string) => {
    let res = (
      myResults ? (myResults as any)[id] : undefined
    ) as ChallengeResultModel;
    if (res === undefined) {
      return { outcome: undefined, code: undefined };
    }
    if (!res) {
      return { outcome: false, code: undefined };
    }

    // we might be able to retire the instanceof selector later
    if (res instanceof Boolean) {
      return { outcome: res, code: undefined };
    } else {
      let resc = res as any;
      return {
        outcome: resc.correct,
        code: resc.correct ? resc["correct-code"] : resc["wrong-code"],
      };
    }
  };

  return (
    <TableRow>
      <TableCell>{props.student}</TableCell>
      <TableCell>?/{props.challengeIds?.length}</TableCell>
      <TableCell>
        <div className="res-container">
          {myResults
            ? props.challengeIds?.map((id) => {
                let p = passed(id);
                return (
                  <Tooltip
                    key={id}
                    title={
                      p.code ? (
                        <React.Fragment>
                          <code>
                            <pre>{p.code}</pre>
                          </code>
                        </React.Fragment>
                      ) : undefined
                    }
                  >
                    <span
                      className={" res-" + p.outcome?.toString() || "undef"}
                    >
                      {" "}
                    </span>
                  </Tooltip>
                );
              })
            : undefined}
        </div>
      </TableCell>
    </TableRow>
  );
};

const ResultsTable = (props: ResultsTableProps) => {
  const [challengeIds, setChallengeIds] = useState<Array<string> | undefined>(
    undefined
  );

  useEffect(() => {
    if (!props.book) {
      setChallengeIds(undefined);
      return;
    }

    setChallengeIds(extractIdsWithTestsInOrder(props.book));
  }, [props.book]);

  if (!props.group) {
    return <p>Please pick a group to display results.</p>;
  }

  if (!props.bookTitle) {
    return <p>Please pick a book to display results.</p>;
  }

  return (
    <Box sx={{ width: "100%" }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>%</TableCell>
              <TableCell>Breakdown</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.group.students.map((student) => {
              return (
                <ResultsTableRow
                  key={student}
                  student={student}
                  challengeIds={challengeIds}
                  results={props.results}
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
