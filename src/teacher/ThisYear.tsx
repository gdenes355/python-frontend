import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid2,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { saveAs } from "file-saver";
import { Container } from "@mui/system";
import { Allotment, AllotmentHandle } from "allotment";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DownloadIcon from "@mui/icons-material/Download";
import DoneIcon from "@mui/icons-material/Done";
import ErrorIcon from "@mui/icons-material/Error";
import AddIcon from "@mui/icons-material/Add";
import ExcelDownloadIcon from "../icons/ExcelDownloadIcon";
import SessionContext from "../auth/contexts/SessionContext";
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
import AddGroupDialog from "./components/dialogs/AddGroupDialog";
import { zipResults } from "./utils";
import TeacherContainer from "./TeacherContainer";
import { useOutletContext } from "react-router-dom";
import { OutletContextType } from "../auth/AdminWrapper";
import { useResultsDownloadExcel } from "./hooks/api/useResultsDownloadExcel";
import { useClasses } from "./hooks/api/useClasses";
import NotificationsContext from "../components/NotificationsContext";
import { useClassesCreate } from "./hooks/api/useClassesCreate";
import { useClassesAddBook } from "./hooks/api/useClassesAddBook";
import useBookList from "./hooks/api/useBookList";
import { useClassesStudentsAdd } from "./hooks/api/useClassesStudentsAdd";
import { useClassesStudentsDelete } from "./hooks/api/useClassesStudentsDelete";
import BookInput from "./components/BookInput";
import { useClassesPatchBookActive } from "./hooks/api/useClassesPatchBookActive";
import RefreshIcon from "@mui/icons-material/Refresh";
import TimerIcon from "@mui/icons-material/Timer";
import TimerOffIcon from "@mui/icons-material/TimerOff";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import AddStudentsToClassDialog from "./components/dialogs/AddStudentsToClassDialog";

type GroupBook = {
  bookTitle: string;
  enabled: boolean;
};

type DownloadState = "idle" | "done" | "error" | "downloading";

const ThisYear = () => {
  const sessionContext = useContext(SessionContext);
  const notificationContext = useContext(NotificationsContext);

  const [classInputValue, setClassInputValue] = React.useState("");
  const [activeClass, setActiveGroup] = useState<ClassModel | undefined>(
    undefined
  );
  const [updateCtr, setUpdateCtr] = useState<number>(0);
  const forceUpdate = useCallback(() => setUpdateCtr((c) => c + 1), []);

  const [booksInGroup, setBooksInGroup] = useState<Array<GroupBook>>([]);
  const [activeBookTitle, setActiveBookTitle] = useState<string | undefined>(
    undefined
  );
  const activeBookTitleRef = useRef<string | undefined>(undefined); // not for rendering, just for persistence across group changes

  const [book, setBook] = useState<BookNodeModel | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [bookFetcher, setBookFetcher] = useState<BookFetcher | undefined>(
    undefined
  );

  const [dialogState, setDialogState] = useState<string>("");

  const [results, setResults] = useState<Array<ResultsModel>>([]);

  const [zipDownloadState, setZipDownloadState] =
    useState<DownloadState>("idle");
  const [excelDownloadState, setExcelDownloadState] =
    useState<DownloadState>("idle");

  const [stagedResults, setStagedResults] = useState<
    Map<string, ChallengeResultComplexModel>
  >(new Map());

  const [highlightAttemptedToday, setHighlightAttemptedToday] =
    useState<boolean>(false);
  const [onlyShowTop5, setOnlyShowTop5] = useState<boolean>(false);

  const { mutate: downloadResultsExcel, isPending: isDownloadingExcel } =
    useResultsDownloadExcel({
      onSuccess: () => {
        setExcelDownloadState("done");
        setTimeout(() => {
          setExcelDownloadState("idle");
        }, 3000);
      },
      onError: (error) => {
        setExcelDownloadState("error");
        console.log(error);
      },
    });
  const { data: classes, isLoading: isLoadingClasses } = useClasses();
  const { data: bookTitles } = useBookList();
  const activeClasses = useMemo(
    () => classes?.filter((c) => c.active),
    [classes]
  );
  const { mutate: createClass } = useClassesCreate({
    onSuccess: (_, { className }: { className: string }) => {
      localStorage.setItem("teacher-activeGroup", className);
      window.location.reload(); // happens rarely enough and when it does, the cache would need to be purged anyway
    },
    onError: (error: Error) => {
      notificationContext.addMessage(error.message, "error");
    },
  });
  const { mutate: addBookToClass } = useClassesAddBook({
    onSuccess: (_, { book }: { book: string }) => {
      notificationContext.addMessage("Book added to class", "success");
      setActiveBookTitle(book);
      setDialogState("");
      forceUpdate();
    },
    onError: (error: Error) => {
      notificationContext.addMessage(error.message, "error");
    },
  });
  const { mutate: addStudentsToClass } = useClassesStudentsAdd({
    onSuccess: () => {
      notificationContext.addMessage("Students added to class", "success");
      forceUpdate();
    },
    onError: (error: Error) => {
      notificationContext.addMessage(error.message, "error");
    },
  });
  const { mutate: deleteStudentFromClass } = useClassesStudentsDelete({
    onSuccess: () => {
      notificationContext.addMessage("Student removed from class", "success");
      forceUpdate();
    },
    onError: (error: Error) => {
      notificationContext.addMessage(error.message, "error");
    },
  });
  const { mutate: patchBookActive } = useClassesPatchBookActive({
    onSuccess: () => {
      notificationContext.addMessage("Book active updated", "success");
      forceUpdate();
    },
    onError: (error: Error) => {
      notificationContext.addMessage(error.message, "error");
    },
  });

  const allotmentRef = useRef<AllotmentHandle>(null);

  const resultsTableRef = useRef<ResultsTableRef>(null);

  const oc: OutletContextType = useOutletContext();

  useEffect(() => {
    if (activeClasses) {
      const prevActGroup = localStorage.getItem("teacher-activeGroup");
      if (prevActGroup) {
        setActiveGroup(
          activeClasses.find((g: ClassModel) => g.name === prevActGroup)
        );
      }
    }
  }, [activeClasses]);

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
            return;
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
    activeBookTitleRef.current = activeBookTitle;
  }, [activeBookTitle]);

  useEffect(() => {
    if (!activeClass) return;
    localStorage.setItem("teacher-activeGroup", activeClass.name);
    const displayBooks: Array<GroupBook> = [
      ...(activeClass.books?.map((b) => ({ bookTitle: b, enabled: true })) ||
        []),
      ...(activeClass.disabled_books?.map((b) => ({
        bookTitle: b,
        enabled: false,
      })) || []),
    ];
    setBooksInGroup(displayBooks);
    let newActiveBook: GroupBook | undefined = undefined;
    if (activeBookTitleRef.current) {
      newActiveBook = displayBooks.find(
        (b) => b.bookTitle === activeBookTitleRef.current
      );
    }
    setActiveBookTitle(newActiveBook?.bookTitle);
    if (sessionContext.wsSend) {
      sessionContext.wsSend({
        cmd: "reg-teacher-group",
        students: activeClass.students,
      });
    }
  }, [activeClass, updateCtr, sessionContext]);

  useEffect(() => {
    setError(undefined);

    if (!activeBookTitle || !activeClass) {
      setBookFetcher(undefined);
      setResults([]);
      return;
    }

    setBook(undefined);

    setBookFetcher(new BookFetcher(activeBookTitle));
    oc.request(
      `api/admin/classes/${activeClass.name}/books/${encodeURIComponent(
        activeBookTitle
      )}/results?ts=${Date.now()}`
    )
      .then((r) => setResults(r))
      .catch((e) => setError(e.reason));
  }, [activeBookTitle, oc, activeClass, updateCtr]);

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
      .catch(() => {
        setBook(undefined);
        setError("Failed to load book from server");
      });
  }, [bookFetcher, sessionContext, error]);

  const onResultAdd = useCallback((res: ChallengeResultComplexModel) => {
    const key = `${res.student}-${res.id}`;
    setStagedResults((stagedResults) => new Map(stagedResults).set(key, res)); // trigger update
  }, []);

  const onResultSet = useCallback((res: ChallengeResultComplexModel) => {
    const key = `${res.student}-${res.id}`;
    setStagedResults(new Map().set(key, res));
  }, []);

  const onResultsSet = useCallback((ress: ChallengeResultComplexModel[]) => {
    const newMap = new Map<string, ChallengeResultComplexModel>();
    for (const res of ress) {
      const key = `${res.student}-${res.id}`;
      newMap.set(key, res);
    }
    setStagedResults(newMap);
  }, []);

  const handleAddStudents = (usernames: string[]) => {
    setDialogState("");
    if (!activeClass || !usernames) return;
    const studentsToAdd = usernames.filter(
      (u) => u !== "" && !activeClass.students.includes(u)
    );
    if (studentsToAdd.length === 0) return;
    addStudentsToClass({
      className: activeClass.name,
      students: studentsToAdd,
    });
  };

  const onDownloadResultsZip = () => {
    if (!results.length || !book) {
      setZipDownloadState("error");
      setTimeout(() => {
        setZipDownloadState("idle");
      }, 3000);
      return;
    }
    zipResults(results, book)
      .then((blob) => saveAs(blob, `results-${book.name}.zip`))
      .then(() => {
        setZipDownloadState("done");
      })
      .catch((e: any) => {
        setZipDownloadState("error");
        console.log(e);
      })
      .then(() => {
        setTimeout(() => {
          setZipDownloadState("idle");
        }, 3000);
      });
  };

  const onDownloadResultsXslx = () => {
    if (!activeClass) {
      setExcelDownloadState("error");
      setTimeout(() => {
        setExcelDownloadState("idle");
      }, 3000);
      return;
    }
    downloadResultsExcel(activeClass.name);
  };

  return (
    <TeacherContainer
      headerChildren={
        <Grid2 key="reset-view">
          <Button
            style={{ height: "100%" }}
            onClick={() => {
              allotmentRef.current?.reset();
              onResultsSet([]);
            }}
          >
            Reset view
          </Button>
          <Tooltip title="Download book codes as a zip file" placement="bottom">
            <span>
              <IconButton
                aria-label="download results"
                size="small"
                onClick={() => onDownloadResultsZip()}
                style={{ height: "100%", borderRadius: "0px" }}
                disabled={
                  zipDownloadState !== "idle" || !book || !results.length
                }
                color="primary"
              >
                {zipDownloadState === "downloading" ? (
                  <CircularProgress size={24} />
                ) : zipDownloadState === "done" ? (
                  <DoneIcon />
                ) : zipDownloadState === "error" ? (
                  <ErrorIcon />
                ) : zipDownloadState === "idle" ? (
                  <DownloadIcon />
                ) : undefined}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Export class results for the whole year as xlsx">
            <span>
              <IconButton
                aria-label="download all results as excel sheet"
                size="small"
                onClick={() => onDownloadResultsXslx()}
                style={{ height: "100%", borderRadius: "0px" }}
                color="primary"
                disabled={excelDownloadState !== "idle" || !activeClass}
              >
                {isDownloadingExcel ? (
                  <CircularProgress size={24} />
                ) : excelDownloadState === "done" ? (
                  <DoneIcon />
                ) : excelDownloadState === "error" ? (
                  <ErrorIcon />
                ) : excelDownloadState === "idle" ? (
                  <ExcelDownloadIcon />
                ) : undefined}
              </IconButton>
            </span>
          </Tooltip>
        </Grid2>
      }
    >
      <AddStudentsToClassDialog
        open={dialogState === "addStudent"}
        onClose={() => setDialogState("")}
        onAddStudents={handleAddStudents}
      />
      <InputDialog
        type="combo"
        options={bookTitles}
        disabledOptions={booksInGroup.map((b) => b.bookTitle)}
        title="Add book"
        inputLabel="Book"
        onInputEntered={(bookTitle) =>
          addBookToClass({
            className: activeClass?.name || "",
            book: bookTitle,
          })
        }
        okButtonLabel="Add"
        open={dialogState === "addBook"}
        onClose={() => setDialogState("")}
        renderOption={(option) => option.replace(/^books\//, "")}
        fullWidth
      />
      <AddGroupDialog
        groups={classes || []}
        onInputEntered={(className) => createClass({ className })}
        open={dialogState === "addGroup"}
        onClose={() => setDialogState("")}
      />
      <Allotment defaultSizes={[650, 350]} minSize={3} ref={allotmentRef}>
        <Container sx={{ pt: 3, overflow: "auto", height: "100%" }}>
          {!isLoadingClasses ? (
            <Stack spacing={2}>
              <Grid2 direction="row" container>
                <Grid2
                  sx={{
                    flexGrow: 1,
                  }}
                >
                  <Autocomplete
                    size="small"
                    value={activeClass || null}
                    onChange={(_, n) => setActiveGroup(n || undefined)}
                    inputValue={classInputValue}
                    onInputChange={(_, newValue) =>
                      setClassInputValue(newValue)
                    }
                    options={activeClasses || []}
                    getOptionLabel={(option) => (option ? option.name : "")}
                    renderInput={(params) => (
                      <TextField {...params} label="Group" />
                    )}
                  />
                </Grid2>
                <Grid2>
                  <IconButton onClick={() => setDialogState("addGroup")}>
                    <AddIcon />
                  </IconButton>
                </Grid2>
              </Grid2>

              <Grid2 direction="row" container>
                <Grid2
                  sx={{
                    flexGrow: 1,
                  }}
                >
                  <BookInput
                    disabled={!activeClass}
                    activeBooks={activeClass?.books || []}
                    inactiveBooks={activeClass?.disabled_books || []}
                    value={activeBookTitle || null}
                    onChange={(value) => setActiveBookTitle(value || undefined)}
                    onUpdateBookActive={(book, active) =>
                      patchBookActive({
                        className: activeClass?.name || "",
                        book,
                        active,
                      })
                    }
                  />
                </Grid2>
                <Grid2>
                  <IconButton
                    disabled={!activeClass}
                    onClick={() => setDialogState("addBook")}
                  >
                    <AddIcon />
                  </IconButton>
                </Grid2>
              </Grid2>
            </Stack>
          ) : (
            <CircularProgress />
          )}

          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <>
              <h2>{book?.name}&nbsp;</h2>
              {activeBookTitle ? (
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <a
                    href={`${window.location.origin}?bk=${activeBookTitle}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {window.location.origin}?bk={activeBookTitle}
                  </a>

                  <div>
                    <Tooltip
                      title={
                        highlightAttemptedToday
                          ? "Show all results the same way"
                          : "Highlight results that have been attempted today"
                      }
                    >
                      <IconButton
                        size="small"
                        onClick={() => setHighlightAttemptedToday((v) => !v)}
                        color={highlightAttemptedToday ? "primary" : "default"}
                      >
                        {highlightAttemptedToday ? (
                          <TimerIcon />
                        ) : (
                          <TimerOffIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Only show the top 5 students">
                      <IconButton
                        size="small"
                        onClick={() => setOnlyShowTop5((v) => !v)}
                        color={onlyShowTop5 ? "primary" : "default"}
                      >
                        {onlyShowTop5 ? <StarIcon /> : <StarHalfIcon />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Reload the results table. This is resource intensive and should be used sparingly when Websocket is not available.">
                      <IconButton size="small" onClick={() => forceUpdate()}>
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </div>
                </Stack>
              ) : undefined}
              <ResultsTable
                ref={resultsTableRef}
                book={book}
                bookTitle={activeBookTitle}
                klass={activeClass}
                updateCtr={updateCtr}
                highlightAttemptedToday={highlightAttemptedToday}
                onlyShowTop5={onlyShowTop5}
                results={results}
                onResultSelected={onResultSet}
                onResultAdd={onResultAdd}
                onResultsSelected={onResultsSet}
                onDeleteStudent={(student) =>
                  deleteStudentFromClass({
                    className: activeClass?.name || "",
                    student,
                  })
                }
              />
              {activeClass?.students.length === 0 ? (
                <Alert severity="info" sx={{ my: 2 }}>
                  No students in this class. Add some to get started.
                </Alert>
              ) : undefined}
              {activeClass ? (
                <IconButton
                  size="small"
                  onClick={() => setDialogState("addStudent")}
                >
                  <AddIcon />
                  Add students
                </IconButton>
              ) : undefined}
            </>
          )}
        </Container>

        <Box sx={{ overflow: "auto", height: "100%" }}>
          <ResultCodePane
            results={[...stagedResults.values()]}
            book={activeBookTitleRef.current || ""}
          />
        </Box>
      </Allotment>
    </TeacherContainer>
  );
};

export default ThisYear;
