import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Box } from "@mui/system";
import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import BookNodeModel, {
  extractIdsWithTestsInOrder,
  extractIds,
} from "../../models/BookNodeModel";
import {
  ClassModel,
  ResultsModel,
  ChallengeResultComplexModel,
} from "../Models";

import "./ResultsTable.css";
import StudentPopupMenu, { StudentPopupMenuHandle } from "./StudentPopupMenu";
import ResultsTableRow, {
  ChallengeInfo,
  ResultsTableRowRef,
  resultFromId,
} from "./ResultsTableRow";

type ResultsTableProps = {
  group?: ClassModel;
  bookTitle?: string;
  book?: BookNodeModel;
  results?: Array<ResultsModel>;
  updateCtr: number;
  onResultsSelected: (res: ChallengeResultComplexModel[]) => void;
  onResultSelected: (res: ChallengeResultComplexModel) => void;
  onResultAdd: (res: ChallengeResultComplexModel) => void;
  onDeleteStudent: (student: string) => void;
};

type ResultsTableRef = {
  updateCell: (student: string, id: string) => void;
};

const ResultsTable = React.forwardRef<ResultsTableRef, ResultsTableProps>(
  (props, ref) => {
    useImperativeHandle(ref, () => ({ updateCell }));

    const updateCell = (student: string, id: string) => {
      let row = rowRefs.current.get(student);
      if (row) row.updateCell(id);
    };

    const [challengeInfo, setChallengeInfo] = useState<
      ChallengeInfo | undefined
    >(undefined);

    const rowRefs = useRef<Map<string, ResultsTableRowRef>>(new Map());

    useEffect(() => {
      if (!props.book) {
        setChallengeInfo(undefined);
        return;
      }

      let ids = extractIdsWithTestsInOrder(props.book);
      let map = extractIds(props.book);
      setChallengeInfo({ ids, map });
    }, [props.book]);

    const popupMenuRef = useRef<StudentPopupMenuHandle>(null);

    const resultsProcessed = useMemo(
      () =>
        new Map(
          props.group?.students.map((student) => {
            let res = props.results?.length
              ? props.results?.filter((r) => r.user === student).at(0)
              : null;
            let passCount: number | undefined = undefined;
            if (res && challengeInfo) {
              passCount = 0;
              for (let id of challengeInfo.ids) {
                let r = (res as any)[id] as any;
                if (
                  (r instanceof Boolean && (r as boolean)) ||
                  (r as ChallengeResultComplexModel)?.correct
                ) {
                  passCount++;
                }
              }
            }
            return [
              student,
              { student: student, results: res, passCount: passCount },
            ];
          })
        ),
      [props.results, props.group, challengeInfo]
    );

    if (!props.group) {
      return <p>Please pick a group to display results.</p>;
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
                let res = resultsProcessed.get(student);
                return (
                  <ResultsTableRow
                    key={student}
                    student={student}
                    name={res?.results?.name || student}
                    bookSelected={!!props.book}
                    menu={popupMenuRef}
                    challengeInfo={challengeInfo}
                    passCount={res?.passCount}
                    results={res?.results}
                    onResultSelected={onResultSelected}
                    onResultsSelected={props.onResultsSelected}
                    ref={(r) => {
                      if (r) rowRefs.current.set(student, r);
                      else rowRefs.current.delete(student);
                    }}
                  />
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <StudentPopupMenu
          ref={popupMenuRef}
          onDeleteStudent={props.onDeleteStudent}
        />
      </Box>
    );
  }
);

export default ResultsTable;
export { ResultsTableRef };
