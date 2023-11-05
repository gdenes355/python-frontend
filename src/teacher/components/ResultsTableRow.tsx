import React, { useImperativeHandle, useMemo, useState } from "react";
import {
  ChallengeResultComplexModel,
  ChallengeResultModel,
  ResultsModel,
} from "../Models";
import BookNodeModel from "../../models/BookNodeModel";
import { StudentPopupMenuHandle } from "./StudentPopupMenu";
import styled from "@emotion/styled";
import {
  IconButton,
  Skeleton,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import SelectAllIcon from "@mui/icons-material/SelectAll";

type ChallengeInfo = {
  ids: Array<string>;
  map: Map<string, BookNodeModel>;
};

type ResultsTableRowRef = {
  updateCell: (id: string) => void;
};

type ResultsTableRowProps = {
  student: string;
  name: string;
  passCount?: number;
  results?: ResultsModel | null;
  bookSelected: boolean;
  challengeInfo?: ChallengeInfo;
  menu: React.RefObject<StudentPopupMenuHandle>;
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

const ResultsTableRow = React.forwardRef<
  ResultsTableRowRef,
  ResultsTableRowProps
>((props, ref) => {
  useImperativeHandle(ref, () => ({ updateCell }));

  const [updateCtr, setUpdateCtr] = useState<number>(0);

  const updateCell = (id: string) => {
    setUpdateCtr((updateCtr) => updateCtr + 1);
  };

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
      props.results ? (props.results as any)[id] : undefined
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
    if (!props.results) return;
    let res = resultFromId(
      id,
      props.results,
      props.student,
      props.challengeInfo
    );
    if (res === undefined) return;
    props.onResultSelected(res, e.shiftKey, e.altKey);
  };

  const selectAllResults = () => {
    if (!props.results) return;
    let results: ChallengeResultComplexModel[] = [];
    for (let id of props.challengeInfo?.ids || []) {
      let res = resultFromId(
        id,
        props.results,
        props.student,
        props.challengeInfo
      );
      if (res) {
        results.push(res);
      }
    }
    props.onResultsSelected(results);
  };

  return (
    <TableRow>
      <TableCell
        onContextMenu={(e) =>
          props.menu.current?.handleContextMenu(e, props.student)
        }
      >
        {props.name}
        <span style={{ visibility: "collapse" }}>{updateCtr}</span>
      </TableCell>
      <TableCell>
        {props.bookSelected ? (
          <span>
            {props.passCount || "?"}/{props.challengeInfo?.ids?.length}
          </span>
        ) : (
          <span />
        )}
      </TableCell>
      <TableCell>
        {props.bookSelected ? (
          <div className="res-container">
            {props.results !== null && props.challengeInfo ? (
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
            ) : props.results === null || !props.challengeInfo ? (
              <Skeleton
                animation="wave"
                sx={{ width: "100%" }}
                variant="rectangular"
              />
            ) : (
              <span>no results</span>
            )}
          </div>
        ) : (
          <span />
        )}
      </TableCell>
      <TableCell>
        {props.bookSelected ? (
          <IconButton
            size="small"
            sx={{ padding: "0px" }}
            onClick={(e) => selectAllResults()}
          >
            <SelectAllIcon />
          </IconButton>
        ) : (
          <span />
        )}
      </TableCell>
    </TableRow>
  );
});

export default ResultsTableRow;
export { ChallengeInfo, resultFromId, ResultsTableRowRef };
