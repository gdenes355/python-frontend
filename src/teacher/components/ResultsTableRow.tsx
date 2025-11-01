import React, { useImperativeHandle, useMemo, useState } from "react";
import {
  ChallengeResultComplexModel,
  ChallengeResultModel,
  AggregatedResultsModel,
  ResultsModel,
} from "../Models";
import BookNodeModel from "../../models/BookNodeModel";
import { StudentPopupMenuHandle } from "./menus/StudentPopupMenu";
import { styled } from "@mui/material/styles";
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
  aggregatedResultsFetcher: (
    student: string
  ) => AggregatedResultsModel | undefined;
  student: string;
  bookSelected: boolean;
  challengeInfo?: ChallengeInfo;
  highlightAttemptedToday: boolean;
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
  name: string,
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
      name,
    };
  } else {
    let resc = res as ChallengeResultComplexModel;
    resc.student = student;
    resc.id = id;
    resc.title = challengeInfo?.map.get(id)?.name;
    resc.name = name;
    return resc;
  }
};

const resultToCode = (
  outcome: boolean,
  _: boolean,
  hasSeenWrong: boolean,
  isAttemptedToday: boolean
) => {
  if (isAttemptedToday) {
    if (outcome === false) return -1;
    if (outcome === true && hasSeenWrong) return 1;
    return 2;
  }
  if (outcome === false) return "-1-p";
  if (outcome === true && hasSeenWrong) return "1-p";
  return "2-p";
};

const ResultsTableRow = React.forwardRef<
  ResultsTableRowRef,
  ResultsTableRowProps
>(({ aggregatedResultsFetcher, ...props }, ref) => {
  useImperativeHandle(ref, () => ({ updateCell }));

  const [updateCtr, setUpdateCtr] = useState<number>(0);

  const aggregatedResults = aggregatedResultsFetcher(props.student);

  const passCount = aggregatedResults?.passCount || 0;
  const results = aggregatedResults?.results;
  const name = results?.name || props.student;

  let computedPassCount = 0;
  for (let id of props.challengeInfo?.ids || []) {
    let r = (results as any)?.[id] as any;
    if (
      (r instanceof Boolean && (r as boolean)) ||
      (r as ChallengeResultComplexModel)?.correct
    ) {
      computedPassCount++;
    }
  }

  const updateCell = () => {
    setUpdateCtr((updateCtr) => updateCtr + 1);
  };

  const getPassedCode = (id: string) => {
    let res = (
      results ? (results as any)[id] : undefined
    ) as ChallengeResultModel;
    if (res === undefined) {
      return 0;
    }

    // we might be able to retire the instanceof selector later
    if (res === true || res === false) {
      return resultToCode(res as boolean, false, false, false);
    } else {
      let resc = res as ChallengeResultComplexModel;
      return resultToCode(
        resc.correct,
        !!resc["correct-date"],
        !!resc["wrong-date"],
        props.highlightAttemptedToday
          ? aggregatedResults?.challengeIdsAttemptedToday?.has(id) || false
          : true
      );
    }
  };

  const StyledResCell = useMemo(
    () =>
      styled("span")(
        () => `
  width: ${100 / (props.challengeInfo?.ids.length || 10)}%;
  `
      ),
    [props.challengeInfo?.ids]
  );

  const onIndividialResultClicked = (e: React.MouseEvent, id: string) => {
    if (!results) return;
    let res = resultFromId(
      id,
      results,
      props.student,
      results.name || props.student,
      props.challengeInfo
    );
    if (res === undefined) return;
    props.onResultSelected(res, e.shiftKey, e.altKey);
  };

  const selectAllResults = () => {
    if (!results) return;
    let sResults: ChallengeResultComplexModel[] = [];
    for (let id of props.challengeInfo?.ids || []) {
      let res = resultFromId(
        id,
        results,
        props.student,
        results.name || props.student,
        props.challengeInfo
      );
      if (res) {
        sResults.push(res);
      }
    }
    props.onResultsSelected(sResults);
  };

  return (
    <TableRow>
      <TableCell
        onContextMenu={(e) =>
          props.menu.current?.handleContextMenu(e, props.student)
        }
      >
        {name.replace(/ /g, "\u00A0")}
        <span style={{ visibility: "collapse" }}>{updateCtr}</span>
      </TableCell>
      <TableCell>
        {props.bookSelected ? (
          <span>
            {passCount || "?"}/{props.challengeInfo?.ids?.length}
          </span>
        ) : (
          <span />
        )}
      </TableCell>
      <TableCell>
        {props.bookSelected ? (
          <div className="res-container">
            {results !== null && props.challengeInfo ? (
              props.challengeInfo?.ids?.map((id) => {
                return (
                  <Tooltip
                    key={id}
                    className={" res res-" + getPassedCode(id)}
                    title={props.challengeInfo?.map.get(id)?.name}
                    onClick={(e) => onIndividialResultClicked(e, id)}
                  >
                    <StyledResCell />
                  </Tooltip>
                );
              })
            ) : results === null || !props.challengeInfo ? (
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
            onClick={() => selectAllResults()}
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
