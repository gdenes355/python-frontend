import {
  SortDirection,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
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

type SortKey = "student" | "pass" | undefined;

type SortableTableHeadCellProps = {
  name: string;
  sortActive: boolean;
  sortDirection?: SortDirection;
  onRequestSort: () => void;
};

const SortableTableHeadCell = (props: SortableTableHeadCellProps) => {
  return (
    <TableCell sortDirection={props.sortActive ? props.sortDirection : false}>
      <TableSortLabel
        active={props.sortActive}
        direction={props.sortActive ? props.sortDirection || "asc" : "asc"}
        onClick={() => {
          props.onRequestSort();
        }}
      >
        {props.name}
      </TableSortLabel>
    </TableCell>
  );
};

const ResultsTable = React.forwardRef<ResultsTableRef, ResultsTableProps>(
  (props, ref) => {
    useImperativeHandle(ref, () => ({ updateCell }));

    const [orderBy, setOrderBy] = useState<SortKey>(undefined);
    const [orderDir, setOrderDir] = useState<SortDirection>("asc");

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

    const onRequestSort = (name: SortKey) => {
      const isAsc = orderBy === name && orderDir === "asc";
      setOrderDir(isAsc ? "desc" : "asc");
      setOrderBy(name);
    };

    const getComparator = () => {
      if (!orderBy) return () => 0;
      if (orderBy === "student") {
        return orderDir === "asc"
          ? (a: any, b: any) =>
              (a["name"] as string).localeCompare(b["student"] as string)
          : (a: any, b: any) =>
              (b["name"] as string).localeCompare(a["student"] as string);
      }
      if (orderBy === "pass") {
        return orderDir === "asc"
          ? (a: any, b: any) => (a["passCount"] || 0) - (b["passCount"] || 0)
          : (a: any, b: any) => (b["passCount"] || 0) - (a["passCount"] || 0);
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
                <SortableTableHeadCell
                  name="Student"
                  sortActive={orderBy === "student"}
                  sortDirection={orderDir}
                  onRequestSort={() => onRequestSort("student")}
                />
                <SortableTableHeadCell
                  name=""
                  sortActive={orderBy === "pass"}
                  sortDirection={orderDir}
                  onRequestSort={() => onRequestSort("pass")}
                />

                <TableCell>Breakdown</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {props.group.students
                .map((student) => {
                  const res = resultsProcessed.get(student);
                  const name = res?.results?.name || student;
                  const passCount = res?.passCount || 0;
                  const results = res?.results;
                  return { student, name, passCount, results };
                })
                .sort(getComparator())
                .map(({ student, name, passCount, results }) => {
                  return (
                    <ResultsTableRow
                      key={student}
                      student={student}
                      name={name}
                      bookSelected={!!props.book}
                      menu={popupMenuRef}
                      challengeInfo={challengeInfo}
                      passCount={passCount}
                      results={results}
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
