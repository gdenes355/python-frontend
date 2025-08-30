import {
  Box,
  Grid2,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { useContext, useMemo, useRef, useState } from "react";
import { ChallengeResultComplexModel } from "../Models";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vs,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import VsThemeContext from "../../themes/VsThemeContext";
import CancelIcon from "@mui/icons-material/Cancel";
import DoneIcon from "@mui/icons-material/Done";
import AddCommentIcon from "@mui/icons-material/AddComment";
import SaveIcon from "@mui/icons-material/Save";
import RateReviewIcon from "@mui/icons-material/RateReview";

import { OutletContextType } from "../../auth/AdminWrapper";
import { useOutletContext } from "react-router-dom";
import SessionContext from "../../auth/contexts/SessionContext";
import NotificationsContext from "../../components/NotificationsContext";

// register languages which are needed for syntax highlighting
import py from "react-syntax-highlighter/dist/esm/languages/prism/python";

SyntaxHighlighter.registerLanguage("python", py);

type ResultCodePaneProps = {
  results: ChallengeResultComplexModel[];
  book?: string;
};

type ResultCardProps = {
  result: ChallengeResultComplexModel;
  book?: string;
};

const dateOpts: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

type CommentBoxProps = {
  savedComment: string;
  onSaveComment: (comment: string) => void;
  onCancel: () => void;
};

const CommentBox = (props: CommentBoxProps) => {
  const [editing, setEditing] = useState<boolean>(!props.savedComment);

  const inputRef = useRef<HTMLInputElement | null>(null);
  if (editing) {
    return (
      <Paper sx={{ marginBottom: 1 }}>
        <Tooltip title="Comment to student. Save: Ctrl+Enter; Discard: Esc">
          <TextField
            size="small"
            fullWidth={true}
            placeholder="Comment to student"
            multiline
            variant="standard"
            inputRef={(r) => {
              inputRef.current = r;
              r?.focus();
            }}
            inputProps={{
              sx: { paddingLeft: 1 },
            }}
            defaultValue={props.savedComment}
            onKeyUp={(e) => {
              if (e.key === "Escape") {
                setEditing(false);
                props.onCancel();
              } else if (e.key === "Enter" && e.ctrlKey) {
                setEditing(false);
                props.onSaveComment(inputRef.current?.value || "");
              }
            }}
            InputProps={{
              endAdornment: (
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditing(false);
                    props.onSaveComment(inputRef.current?.value || "");
                  }}
                >
                  <SaveIcon />
                </IconButton>
              ),
            }}
          />
        </Tooltip>
      </Paper>
    );
  }
  return (
    <Box>
      {(props.savedComment || "").split("\n").map((line, idx) => (
        <span key={idx}>
          {line}
          <br />
        </span>
      ))}
      <IconButton
        sx={{ float: "right" }}
        onClick={() => setEditing(true)}
        size="small"
      >
        <RateReviewIcon />
      </IconButton>
    </Box>
  );
};

const ResultCard = (props: ResultCardProps) => {
  const themeContext = useContext(VsThemeContext);
  const { result } = props;

  const oc: OutletContextType = useOutletContext();
  const sessionContext = useContext(SessionContext);
  const notificationContext = useContext(NotificationsContext);

  const [comment, setComment] = useState(result.comment);

  const onSaveComment = (comment: string) => {
    if (!props.book) return;
    fetch(
      `${oc.urlBase}/api/admin/students/${
        result.student
      }/books/${encodeURIComponent(props.book)}/results/${result.id}/comment`,
      {
        method: "POST",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionContext.token}`,
        },
        body: JSON.stringify({ comment }),
      }
    )
      .then((resp) => {
        if (resp.status === 200) {
          notificationContext.addMessage("Comment saved", "success");
          result.comment = comment;
          setCommentVisible(!!result.comment);
          setComment(comment);
        } else {
          notificationContext.addMessage("Failed to save comment", "error");
        }
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const [commentVisible, setCommentVisible] = useState<boolean>(
    !!result.comment
  );

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
      <Grid2 container spacing={2} style={{ display: "flex" }}>
        <Grid2>{`${result.name || result.student} for challenge ${
          result.title
        }`}</Grid2>
        <Grid2 sx={{ flexGrow: 1, justifyContent: "center", display: "flex" }}>
          {date?.toLocaleString("en-gb", dateOpts)}
        </Grid2>
        <Grid2 sx={{ flexGrow: 1, justifyContent: "right", display: "flex" }}>
          {result["correct-code"] ? (
            <Tooltip title="Show last correct submission">
              <IconButton
                onClick={() => {
                  setCode(result["correct-code"] || "");
                  if (result["correct-date"])
                    setDate(new Date(result["correct-date"]));
                  setOutcome(1);
                }}
              >
                <DoneIcon color="success" />
              </IconButton>
            </Tooltip>
          ) : undefined}
          {result["wrong-code"] ? (
            <Tooltip title="Show last incorrect submission">
              <IconButton
                onClick={() => {
                  setCode(result["wrong-code"] || "");
                  if (result["wrong-date"])
                    setDate(new Date(result["wrong-date"]));
                  setOutcome(result.correct ? 0 : -1);
                }}
              >
                <CancelIcon color="error" />
              </IconButton>
            </Tooltip>
          ) : undefined}
        </Grid2>
      </Grid2>
      {code ? (
        <SyntaxHighlighter
          children={code}
          language="py"
          customStyle={{ fontSize: "1.0em" }}
          style={themeContext.theme === "vs-dark" ? vscDarkPlus : vs}
        />
      ) : undefined}
      {commentVisible ? (
        <CommentBox
          savedComment={comment || ""}
          onSaveComment={onSaveComment}
          onCancel={() => setCommentVisible(!!comment)}
        />
      ) : !comment ? (
        <Tooltip title="Add comment">
          <IconButton
            onClick={() => setCommentVisible(true)}
            sx={{ float: "right" }}
            size="small"
          >
            <AddCommentIcon />
          </IconButton>
        </Tooltip>
      ) : undefined}
    </Box>
  );
};

const ResultCodePane = (props: ResultCodePaneProps) => {
  return (
    <Stack spacing={1} sx={{ paddingLeft: 1, paddingRight: 1 }}>
      {props.results
        .sort((a, b) =>
          (a.name || a.student || "").localeCompare(b.name || b.student || "")
        )
        .map((res) => (
          <ResultCard
            key={`${res.student}-${res.id}`}
            result={res}
            book={props.book}
          />
        ))}
    </Stack>
  );
};

export default ResultCodePane;
