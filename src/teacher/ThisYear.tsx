import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import { saveAs } from "file-saver";
import { Container } from "@mui/system";
import { Allotment, AllotmentHandle } from "allotment";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import DownloadIcon from "@mui/icons-material/Download";
import DoneIcon from "@mui/icons-material/Done";
import ErrorIcon from "@mui/icons-material/Error";
import SessionContext from "../auth/SessionContext";
import BookFetcher from "../book/utils/BookFetcher";
import InputDialog from "../components/dialogs/InputDialog";
import BookNodeModel from "../models/BookNodeModel";
import {
  ClassModel,
  ResultsModel,
  ChallengeResultComplexModel,
} from "./Models";
import ResultCodePane from "./components/ResultCodePane";
import ResultsTable, { ResultsTableRef } from "./components/ResultsTable";
import AddIcon from "@mui/icons-material/Add";
import AddGroupDialog from "./components/AddGroupDialog";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { sanitisePastedEmails, zipResults } from "./utils";
import TeacherContainer from "./TeacherContainer";
import { useOutletContext } from "react-router-dom";
import { OutletContextType } from "../auth/AdminWrapper";

type GroupBook = {
  bookTitle: string;
  enabled: boolean;
};

type DownloadState = "idle" | "downloading" | "done" | "error";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const ThisYear = () => {
  const sessionContext = useContext(SessionContext);
  const textfieldUsernamesRef = useRef<HTMLTextAreaElement>(null);

  const [groups, setGroups] = useState<Array<ClassModel>>([]);
  const [groupInputValue, setGroupInputValue] = React.useState("");
  const [activeGroup, setActiveGroup] = useState<ClassModel | undefined>(
    undefined
  );
  const [updateCtr, setUpdateCtr] = useState<number>(0);
  const forceUpdate = useCallback(() => setUpdateCtr((c) => c + 1), []);

  const [bookTitles, setBookTitles] = useState<Array<string>>([]);
  const [booksInGroup, setBooksInGroup] = useState<Array<GroupBook>>([]);
  const [activeBook, setActiveBook] = useState<GroupBook | undefined>(
    undefined
  );
  const activeBookTitle = useRef<string | undefined>(undefined); // not for rendering, just for persistence across group changes

  const [book, setBook] = useState<BookNodeModel | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [bookFetcher, setBookFetcher] = useState<BookFetcher | undefined>(
    undefined
  );

  const [dialogState, setDialogState] = useState<string>("");

  const [results, setResults] = useState<Array<ResultsModel>>([]);

  const [downloadState, setDownloadState] = useState<DownloadState>("idle");

  const [stagedResults, setStagedResults] = useState<
    Map<string, ChallengeResultComplexModel>
  >(new Map());

  const allotmentRef = useRef<AllotmentHandle>(null);

  const resultsTableRef = useRef<ResultsTableRef>(null);

  const oc: OutletContextType = useOutletContext();

  const onWsMessage = useCallback(
    (msg: any) => {
      if (msg.cmd === "teacher-update") {
        for (let res of results) {
          if (res.user === msg.student) {
            if (msg["ch-id"]) {
              let id = msg["ch-id"];
              let ares = (res as any)[id] as ChallengeResultComplexModel;
              if (!ares) {
                ares = { correct: msg.outcome, id };
                (res as any)[id] = ares;
              }
              ares.correct = msg.outcome;
              if (msg.outcome) {
                ares["correct-code"] = msg.code;
                ares["correct-date"] = new Date().toISOString();
              } else {
                ares["wrong-code"] = msg.code;
                ares["wrong-date"] = new Date().toISOString();
              }
              resultsTableRef.current?.updateCell(msg.student, id);
            }
          }
        }
      }
    },
    [results]
  );

  useEffect(() => {
    sessionContext.registerAdditionalWsHandler?.(onWsMessage);
    return () => {
      sessionContext.unregisterAdditionalWsHandler?.();
    };
  }, [sessionContext, onWsMessage]);

  useEffect(() => {
    oc.request("api/admin/classes?active=true").then((data) => {
      data = data.filter((cls: ClassModel) => !!cls.active); // remove inactive classes
      setGroups(data);
      const prevActGroup = localStorage.getItem("teacher-activeGroup");
      if (prevActGroup) {
        setActiveGroup(data.find((g: ClassModel) => g.name === prevActGroup));
      }
    });
    oc.request("api/admin/books").then((data) => setBookTitles(data));
  }, [oc]);

  useEffect(() => {
    activeBookTitle.current = activeBook?.bookTitle;
  }, [activeBook]);

  useEffect(() => {
    if (!activeGroup) return;
    localStorage.setItem("teacher-activeGroup", activeGroup.name);
    let displayBooks: Array<GroupBook> = [
      ...(activeGroup.books?.map((b) => ({ bookTitle: b, enabled: true })) ||
        []),
      ...(activeGroup.disabled_books?.map((b) => ({
        bookTitle: b,
        enabled: false,
      })) || []),
    ];
    setBooksInGroup(displayBooks);
    let newActiveBook: GroupBook | undefined = undefined;
    if (activeBookTitle.current) {
      newActiveBook = displayBooks.find(
        (b) => b.bookTitle === activeBookTitle.current
      );
    }
    setActiveBook(newActiveBook);
    if (sessionContext.wsSend) {
      sessionContext.wsSend({
        cmd: "reg-teacher-group",
        students: activeGroup.students,
      });
    }
  }, [activeGroup, updateCtr, sessionContext]);

  useEffect(() => {
    setError(undefined);

    if (!activeBook || !activeGroup) {
      setBookFetcher(undefined);
      setResults([]);
      return;
    }

    setBook(undefined);

    setBookFetcher(new BookFetcher(activeBook.bookTitle));
    oc.request(
      `api/admin/classes/${activeGroup.name}/books/${encodeURIComponent(
        activeBook.bookTitle
      )}/results`
    )
      .then((r) => setResults(r))
      .catch((e) => setError(e.reason));
  }, [activeBook, oc, activeGroup, updateCtr]);

  useEffect(() => {
    if (!bookFetcher) {
      setBook(undefined);
      return;
    }
    if (error) {
      return;
    }
    bookFetcher
      .fetchBook(sessionContext)
      .then((res) => setBook(res.book))
      .catch((e) => {
        setBook(undefined);
        setError("Failed to load book from server");
      });
  }, [bookFetcher, sessionContext, error]);

  const onResultAdd = useCallback((res: ChallengeResultComplexModel) => {
    let key = `${res.student}-${res.id}`;
    setStagedResults((stagedResults) => new Map(stagedResults).set(key, res)); // trigger update
  }, []);

  const onResultSet = useCallback((res: ChallengeResultComplexModel) => {
    let key = `${res.student}-${res.id}`;
    setStagedResults(new Map().set(key, res));
  }, []);

  const onResultsSet = useCallback((ress: ChallengeResultComplexModel[]) => {
    let newMap = new Map<string, ChallengeResultComplexModel>();
    for (let res of ress) {
      let key = `${res.student}-${res.id}`;
      newMap.set(key, res);
    }
    setStagedResults(newMap);
  }, []);

  const onAddBook = (bookTitle: string) => {
    setDialogState("");
    if (!activeGroup || !bookTitle) return;
    if (activeGroup.books?.includes(bookTitle)) return;
    fetch(`${oc.urlBase}/api/admin/classes/${activeGroup.name}/books`, {
      method: "post",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionContext.token}`,
      },
      body: JSON.stringify({ book: bookTitle }),
    }).then((resp) => {
      if (resp.status === 200) {
        activeGroup.books?.push(bookTitle);
        setActiveBook({ bookTitle, enabled: true });
        forceUpdate();
      }
    });
  };

  const onAddGroup = (groupName: string) => {
    setDialogState("");
    if (!groupName) return;
    for (let group of groups) {
      if (group.name === groupName) {
        return; // group already exists
      }
    }

    fetch(`${oc.urlBase}/api/admin/classes`, {
      method: "post",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionContext.token}`,
      },
      body: JSON.stringify({ class: groupName }),
    }).then((resp) => {
      if (resp.status === 200) {
        groups.push({ name: groupName, students: [] });
        setActiveGroup(groups[groups.length - 1]);
        window.location.reload(); // happens rarely enough and when it does, the cache would need to be purged anyway
      }
    });
  };

  const onAddStudents = (usernames: string) => {
    setDialogState("");
    if (!activeGroup || !usernames) return;

    const studentsToAdd = usernames
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u !== "" && !activeGroup.students.includes(u));
    fetch(`${oc.urlBase}/api/admin/classes/${activeGroup.name}/students`, {
      method: "post",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionContext.token}`,
      },
      body: JSON.stringify({ user: studentsToAdd }),
    }).then((resp) => {
      if (resp.status === 200) {
        activeGroup?.students.push(...studentsToAdd);
        forceUpdate();
      }
    });
  };

  const onDeleteStudent = (student: string) => {
    if (!activeGroup || !student) return;
    fetch(
      `${oc.urlBase}/api/admin/classes/${activeGroup.name}/students/${student}`,
      {
        method: "delete",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionContext.token}`,
        },
      }
    ).then((resp) => {
      if (resp.status === 200) {
        activeGroup.students = activeGroup.students.filter(
          (s) => s !== student
        );
        forceUpdate();
      }
    });
  };

  const onUpdateBookEnabled = (book: GroupBook, enabled: boolean) => {
    if (!activeGroup) return;
    const group = activeGroup;
    fetch(`${oc.urlBase}/api/admin/classes/${group.name}/books`, {
      method: "post",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionContext.token}`,
      },
      body: JSON.stringify({ book: book.bookTitle, enabled }),
    }).then((resp) => {
      if (resp.status === 200) {
        book.enabled = enabled;
        if (enabled) {
          group.books = [
            ...(group.books?.filter((b) => b !== book.bookTitle) || []),
            book.bookTitle,
          ];
          group.disabled_books = [
            ...(group.disabled_books?.filter((b) => b !== book.bookTitle) ||
              []),
          ];
        } else {
          group.books = [
            ...(group.books?.filter((b) => b !== book.bookTitle) || []),
          ];
          group.disabled_books = [
            ...(group.disabled_books?.filter((b) => b !== book.bookTitle) ||
              []),
            book.bookTitle,
          ];
        }
        forceUpdate();
      }
    });
  };

  const onDownloadResults = () => {
    if (!results.length || !book) {
      setDownloadState("error");
      setTimeout(() => {
        setDownloadState("idle");
      }, 3000);
      return;
    }
    setDownloadState("downloading");
    zipResults(results, book)
      .then((blob) => saveAs(blob, `results-${book.name}.zip`))
      .then(() => {
        setDownloadState("done");
      })
      .catch((e: any) => {
        setDownloadState("error");
        console.log(e);
      })
      .then(() => {
        setTimeout(() => {
          setDownloadState("idle");
        }, 3000);
      });
  };

  return (
    <TeacherContainer
      headerChildren={
        <Grid item key="reset-view">
          <Button
            style={{ height: "100%" }}
            onClick={() => {
              allotmentRef.current?.reset();
              onResultsSet([]);
            }}
          >
            Reset view
          </Button>
          <IconButton
            aria-label="download results"
            size="small"
            onClick={() => onDownloadResults()}
            style={{ height: "100%", borderRadius: "0px" }}
            disabled={downloadState !== "idle" || !book || !results.length}
            color="primary"
          >
            {downloadState === "downloading" ? (
              <CircularProgress size={24} />
            ) : downloadState === "done" ? (
              <DoneIcon />
            ) : downloadState === "error" ? (
              <ErrorIcon />
            ) : downloadState === "idle" ? (
              <DownloadIcon />
            ) : undefined}
          </IconButton>
        </Grid>
      }
    >
      <Dialog
        open={dialogState === "addStudent"}
        onClose={() => setDialogState("")}
        title="Add students"
      >
        <DialogTitle>Add Students</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter students below, one per line, with or without the @ email
            suffix. You can also paste a list of students from Outlook.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="usernames"
            label="Student usernames"
            fullWidth
            variant="standard"
            multiline
            inputRef={textfieldUsernamesRef}
            inputProps={{ maxLength: 1500 }} // say max 60 students at 25 chars per email
            onPaste={(e) => {
              if (
                e.clipboardData.getData("Text") &&
                textfieldUsernamesRef.current
              ) {
                let txt = sanitisePastedEmails(e.clipboardData.getData("Text"));
                let textarea = textfieldUsernamesRef.current;
                let start_position = textarea.selectionStart;
                let end_position = textarea.selectionEnd;
                textarea.value = `${textarea.value.substring(
                  0,
                  start_position
                )}${txt}${textarea.value.substring(
                  end_position,
                  textarea.value.length
                )}`;
                e.preventDefault();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogState("")}>Cancel</Button>
          <Button
            onClick={() =>
              onAddStudents(textfieldUsernamesRef?.current?.value || "")
            }
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <InputDialog
        type="combo"
        options={bookTitles}
        disabledOptions={booksInGroup.map((b) => b.bookTitle)}
        title="Add book"
        inputLabel="Book"
        onInputEntered={onAddBook}
        okButtonLabel="Add"
        open={dialogState === "addBook"}
        onClose={() => setDialogState("")}
        renderOption={(option) => option.replace(/^books\//, "")}
        fullWidth
      />
      <AddGroupDialog
        groups={groups}
        onInputEntered={onAddGroup}
        open={dialogState === "addGroup"}
        onClose={() => setDialogState("")}
      />
      <Allotment defaultSizes={[650, 350]} minSize={3} ref={allotmentRef}>
        <Container sx={{ pt: 3, overflow: "auto", height: "100%" }}>
          {groups.length ? (
            <Stack spacing={2}>
              <Grid direction="row" container>
                <Grid
                  item
                  sx={{
                    flexGrow: 1,
                  }}
                >
                  <Autocomplete
                    size="small"
                    value={activeGroup || null}
                    onChange={(e, n) => setActiveGroup(n || undefined)}
                    inputValue={groupInputValue}
                    onInputChange={(e, newValue) =>
                      setGroupInputValue(newValue)
                    }
                    options={groups}
                    getOptionLabel={(option) => (option ? option.name : "")}
                    renderInput={(params) => (
                      <TextField {...params} label="Group" />
                    )}
                  />
                </Grid>
                <Grid item>
                  <IconButton onClick={() => setDialogState("addGroup")}>
                    <AddIcon />
                  </IconButton>
                </Grid>
              </Grid>

              <Grid direction="row" container>
                <Grid
                  item
                  sx={{
                    flexGrow: 1,
                  }}
                >
                  <Autocomplete
                    size="small"
                    value={activeBook || null}
                    onChange={(e, n) => setActiveBook(n || undefined)}
                    options={booksInGroup.sort((a, b) =>
                      a.enabled !== b.enabled
                        ? a.enabled
                          ? -1
                          : 1
                        : a.bookTitle.localeCompare(b.bookTitle)
                    )}
                    groupBy={(option) =>
                      option.enabled ? "Enabled" : "Disabled"
                    }
                    getOptionLabel={(option) =>
                      option
                        ? option.bookTitle
                            .replace(/^books\//, "")
                            .replace(/\//g, "  /  ")
                        : ""
                    }
                    renderInput={(params) => (
                      <>
                        <TextField {...params} label="Book" />
                      </>
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box sx={{ flex: 1 }}>
                          {option.bookTitle
                            .replace(/^books\//, "")
                            .replace(/\//g, " / ")}
                        </Box>
                        <Checkbox
                          icon={icon}
                          checkedIcon={checkedIcon}
                          style={{ marginRight: 8 }}
                          checked={option.enabled}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            onUpdateBookEnabled(option, e.target.checked);
                          }}
                        />
                      </li>
                    )}
                    disabled={!activeGroup}
                  />
                </Grid>
                <Grid item>
                  <IconButton
                    disabled={!activeGroup}
                    onClick={() => setDialogState("addBook")}
                  >
                    <AddIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Stack>
          ) : (
            <CircularProgress />
          )}

          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <React.Fragment>
              <h2>{book?.name}&nbsp;</h2>
              {activeBook ? (
                <a
                  href={`${window.location.origin}?bk=${activeBook.bookTitle}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {window.location.origin}?bk={activeBook.bookTitle}
                </a>
              ) : undefined}
              <ResultsTable
                ref={resultsTableRef}
                book={book}
                bookTitle={activeBook?.bookTitle}
                group={activeGroup}
                updateCtr={updateCtr}
                results={results}
                onResultSelected={onResultSet}
                onResultAdd={onResultAdd}
                onResultsSelected={onResultsSet}
                onDeleteStudent={onDeleteStudent}
              />
              {activeGroup ? (
                <IconButton
                  size="small"
                  onClick={() => setDialogState("addStudent")}
                >
                  <AddIcon />
                  Add students
                </IconButton>
              ) : undefined}
            </React.Fragment>
          )}
        </Container>

        <Box sx={{ overflow: "auto", height: "100%" }}>
          <ResultCodePane
            results={[...stagedResults.values()]}
            book={activeBookTitle.current || ""}
          />
        </Box>
      </Allotment>
    </TeacherContainer>
  );
};

export default ThisYear;
