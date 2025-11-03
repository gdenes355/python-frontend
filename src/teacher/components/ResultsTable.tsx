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
  useCallback,
  useEffect,
  useImperativeHandle,
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
import StudentPopupMenu, {
  StudentPopupMenuHandle,
} from "./menus/StudentPopupMenu";
import ResultsTableRow, {
  ChallengeInfo,
  ResultsTableRowRef,
  resultFromId,
} from "./ResultsTableRow";
import useAggregatedResults from "../hooks/useAggregatedResults";

type ResultsTableProps = {
  klass?: ClassModel;
  bookTitle?: string;
  book?: BookNodeModel;
  results?: Array<ResultsModel>;
  updateCtr: number;
  highlightAttemptedToday: boolean;
  onlyShowTop5: boolean;
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

const getComparator = (
  orderBy: SortKey,
  orderDir: SortDirection,
  onlyShowTop5: boolean
) => {
  if (onlyShowTop5) {
    // force order by passCount
    return (a: any, b: any) => {
      return (b["passCount"] || 0) - (a["passCount"] || 0);
    };
  }
  if (!orderBy) return () => 0;
  if (orderBy === "student") {
    return orderDir === "asc"
      ? (a: any, b: any) =>
          (a["name"] as string).localeCompare(b["name"] as string)
      : (a: any, b: any) =>
          (b["name"] as string).localeCompare(a["name"] as string);
  }
  if (orderBy === "pass") {
    return orderDir === "asc"
      ? (a: any, b: any) => (a["passCount"] || 0) - (b["passCount"] || 0)
      : (a: any, b: any) => (b["passCount"] || 0) - (a["passCount"] || 0);
  }
};

const ResultsTable = React.forwardRef<ResultsTableRef, ResultsTableProps>(
  (props, ref) => {
    useImperativeHandle(ref, () => ({ updateCell }));

    const [orderBy, setOrderBy] = useState<SortKey>(undefined);
    const [orderDir, setOrderDir] = useState<SortDirection>("asc");

    const [challengeInfo, setChallengeInfo] = useState<
      ChallengeInfo | undefined
    >(undefined);

    const handleInvalidateRowOnly = (student: string, id?: string) => {
      if (!id) {
        return;
      }
      let row = rowRefs.current.get(student);
      if (row) {
        row.updateCell(id);
      }
    };

    const {
      aggregatedResults,
      updateAggregatedResults,
      getAggregateResultsFromRef,
    } = useAggregatedResults(
      props.results,
      props.klass,
      challengeInfo,
      handleInvalidateRowOnly
    );

    const updateCell = (student: string, id: string) => {
      updateAggregatedResults(student, id);
    };

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

    const aggregatedResultsFetcher = useCallback(
      (student: string) => {
        return getAggregateResultsFromRef(student);
      },
      [getAggregateResultsFromRef]
    );

    if (!props.klass) {
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
          let aresT = resultFromId(
            res.id,
            ares,
            ares.user,
            ares.name || ares.user,
            challengeInfo
          );
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
              {props.klass.students
                .map((student) => {
                  const passCount =
                    aggregatedResults.get(student)?.passCount || 0;
                  return {
                    student,
                    passCount,
                    name:
                      aggregatedResults.get(student)?.results?.name || student,
                  };
                })
                .sort(getComparator(orderBy, orderDir, props.onlyShowTop5))
                .slice(0, props.onlyShowTop5 ? 5 : undefined)
                .map(({ student }) => {
                  return (
                    <ResultsTableRow
                      key={student}
                      aggregatedResultsFetcher={aggregatedResultsFetcher}
                      student={student}
                      bookSelected={!!props.book}
                      highlightAttemptedToday={props.highlightAttemptedToday}
                      menu={popupMenuRef}
                      challengeInfo={challengeInfo}
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
