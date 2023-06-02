import React, { useMemo } from "react";
import BookNodeModel from "../../models/BookNodeModel";
import styled from "@emotion/styled";
import { Skeleton, TableCell, TableRow, Tooltip } from "@mui/material";

type ChallengeInfo = {
  ids: Array<string>;
  map: Map<string, BookNodeModel>;
};

type SolutionShowTableRowRef = {};

type SolutionShowTableRowProps = {
  showing?: Array<string>;
  challengeInfo?: ChallengeInfo;
  onSolutionShowSelected: (challengeid: string) => void;
};

const SolutionShowTableRow = React.forwardRef<
  SolutionShowTableRowRef,
  SolutionShowTableRowProps
>((props, ref) => {
  const StyledSolnShowCell = useMemo(
    () =>
      styled("span")(
        ({ theme }) => `
  width: ${100 / (props.challengeInfo?.ids.length || 10)}%;
  `
      ),
    [props.challengeInfo?.ids]
  );

  return (
    <TableRow>
      <TableCell>Solution show</TableCell>
      <TableCell></TableCell>
      <TableCell>
        <div className="res-container">
          {props.challengeInfo ? (
            props.challengeInfo?.ids?.map((id) => {
              return (
                <Tooltip
                  key={id}
                  className={
                    " res res-" + (props.showing?.includes(id) ? "2" : "-1")
                  }
                  title={props.challengeInfo?.map.get(id)?.name}
                  onClick={(e) => props.onSolutionShowSelected(id)}
                >
                  <StyledSolnShowCell />
                </Tooltip>
              );
            })
          ) : !props.challengeInfo ? (
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
      <TableCell></TableCell>
    </TableRow>
  );
});

export default SolutionShowTableRow;
export { ChallengeInfo, SolutionShowTableRowRef };
