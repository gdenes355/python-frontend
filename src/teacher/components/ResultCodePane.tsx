import { Box, Grid, IconButton, Stack } from "@mui/material";
import React, { useContext, useMemo, useState } from "react";
import { ChallengeResultComplexModel } from "../Models";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vs,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import VsThemeContext from "../../themes/VsThemeContext";
import CancelIcon from "@mui/icons-material/Cancel";
import DoneIcon from "@mui/icons-material/Done";

type ResultCodePaneProps = {
  results: ChallengeResultComplexModel[];
};

type ResultCardProps = {
  result: ChallengeResultComplexModel;
};

const dateOpts: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

const ResultCard = (props: ResultCardProps) => {
  const themeContext = useContext(VsThemeContext);
  const { result } = props;

  const [code, setCode] = useState<string>(
    result["correct-code"] || result["wrong-code"] || ""
  );

  const [date, setDate] = useState<Date | undefined>(
    result["correct-date"]
      ? new Date(result["correct-date"])
      : result["wrong-date"]
      ? new Date(result["wrong-date"])
      : undefined
  );

  const [outcome, setOutcome] = useState<number>(
    result.correct === true ? 1 : -1
  );

  const backgroundColor = useMemo(() => {
    switch (outcome) {
      case 1:
        return themeContext.theme === "vs-dark" ? "#004b00" : "#99ff99";
      case -1:
        return themeContext.theme === "vs-dark" ? "#4b0000" : "#ff9999";
      case 0:
        return themeContext.theme === "vs-dark" ? "#4b4b00" : "#ffff99";

      default:
        return "none";
    }
  }, [outcome, themeContext]);

  return (
    <Box sx={{ backgroundColor, paddingLeft: 1, paddingRight: 1 }}>
      <Grid container spacing={2} style={{ display: "flex" }}>
        <Grid item>{`${result.name || result.student} for challenge ${
          result.title
        }`}</Grid>
        <Grid
          item
          sx={{ flexGrow: 1, justifyContent: "center", display: "flex" }}
        >
          {date?.toLocaleString("en-gb", dateOpts)}
        </Grid>
        <Grid
          item
          sx={{ flexGrow: 1, justifyContent: "right", display: "flex" }}
        >
          {result["correct-code"] ? (
            <IconButton
              onClick={(e) => {
                setCode(result["correct-code"] || "");
                if (result["correct-date"])
                  setDate(new Date(result["correct-date"]));
                setOutcome(1);
              }}
            >
              <DoneIcon color="success" />
            </IconButton>
          ) : undefined}
          {result["wrong-code"] ? (
            <IconButton
              onClick={(e) => {
                setCode(result["wrong-code"] || "");
                if (result["wrong-date"])
                  setDate(new Date(result["wrong-date"]));
                setOutcome(result.correct ? 0 : -1);
              }}
            >
              <CancelIcon color="error" />
            </IconButton>
          ) : undefined}
        </Grid>
      </Grid>
      {code ? (
        <SyntaxHighlighter
          children={code}
          language="py"
          customStyle={{ fontSize: "1.0em" }}
          style={themeContext.theme === "vs-dark" ? vscDarkPlus : vs}
        />
      ) : undefined}
    </Box>
  );
};

const ResultCodePane = (props: ResultCodePaneProps) => {
  console.log(props);
  return (
    <Stack spacing={1} sx={{ paddingLeft: 1, paddingRight: 1 }}>
      {props.results
        .sort((a, b) =>
          (a.name || a.student || "").localeCompare(b.name || b.student || "")
        )
        .map((res) => (
          <ResultCard key={`${res.student}-${res.id}`} result={res} />
        ))}
    </Stack>
  );
};

export default ResultCodePane;
