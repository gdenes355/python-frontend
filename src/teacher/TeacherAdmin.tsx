import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import { Container } from "@mui/system";
import { Allotment, AllotmentHandle } from "allotment";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import SessionContext from "../auth/SessionContext";
import BookFetcher from "../book/utils/BookFetcher";
import InputDialog from "../components/dialogs/InputDialog";
import HeaderBar from "../components/HeaderBar";
import BookNodeModel from "../models/BookNodeModel";
import {
  ClassModel,
  ResultsModel,
  ChallengeResultComplexModel,
} from "./Models";
import ResultCodePane from "./ResultCodePane";
import ResultsTable from "./ResultsTable";
import AddIcon from "@mui/icons-material/Add";
import AddGroupDialog from "./AddGroupDialog";

type TeacherAdminProps = {
  baseUrl: string;
};

const TeacherAdmin = (props: TeacherAdminProps) => {
  const sessionContext = useContext(SessionContext);

  const [groups, setGroups] = useState<Array<ClassModel>>([]);
  const [groupInputValue, setGroupInputValue] = React.useState("");
  const [activeGroup, setActiveGroup] = useState<ClassModel | undefined>(
    undefined
  );
  const [updateCtr, setUpdateCtr] = useState<number>(0);
  const forceUpdate = () => setUpdateCtr((c) => c + 1);

  const [bookTitles, setBookTitles] = useState<Array<string>>([]);
  const [bookTitlesInGroup, setBookTitlesInGroup] = useState<Array<string>>([]);
  const [activeBookTitle, setActiveBookTitle] = useState<string | undefined>(
    undefined
  );

  const [book, setBook] = useState<BookNodeModel | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [bookFetcher, setBookFetcher] = useState<BookFetcher | undefined>(
    undefined
  );

  const [dialogState, setDialogState] = useState<string>("");

  const [results, setResults] = useState<Array<ResultsModel>>([]);

  const [stagedResults, setStagedResults] = useState<
    Map<string, ChallengeResultComplexModel>
  >(new Map());

  const allotmentRef = useRef<AllotmentHandle>(null);

  const requestRef = useRef<Map<string, any>>(new Map());
  const request = useCallback(
    (req: string) =>
      new Promise<any>((res, rej) => {
        let cached = requestRef.current.get(req);
        if (cached) {
          res(cached);
        }
        let headers = new Headers();
        headers.append("Authorization", `Bearer ${sessionContext.token}`);
        fetch(`${props.baseUrl}/${req}`, { headers })
          .then((data) => data.json())
          .then((data) => {
            requestRef.current.set(req, data.data);
            res(data.data);
          })
          .catch((e) => rej(`Failed to fetch ${req}`));
      }),
    [sessionContext.token, props.baseUrl]
  );

  useEffect(() => {
    request("api/admin/classes").then((data) => setGroups(data));
    request("api/admin/books").then((data) => setBookTitles(data));
  }, [request]);

  useEffect(() => {
    if (!activeGroup) return;
    setBookTitlesInGroup(activeGroup?.books || []);
    setActiveBookTitle(undefined);
  }, [activeGroup]);

  useEffect(() => {
    setError(undefined);

    if (!activeBookTitle || !activeGroup) {
      setBookFetcher(undefined);
      setResults([]);
      return;
    }

    setBook(undefined);

    setBookFetcher(new BookFetcher(activeBookTitle));
    request(
      `api/admin/classes/${activeGroup.name}/books/${encodeURIComponent(
        activeBookTitle
      )}/results`
    )
      .then(setResults)
      .catch((e) => setError(e.reason));
  }, [activeBookTitle, request, activeGroup]);

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
    fetch(`${props.baseUrl}/api/admin/classes/${activeGroup.name}/books`, {
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
        setActiveBookTitle(bookTitle);
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

    fetch(`${props.baseUrl}/api/admin/classes`, {
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
        forceUpdate();
      }
    });
  };

  const onAddStudent = (username: string) => {
    setDialogState("");
    if (!activeGroup || !username) return;
    if (activeGroup.students.includes(username)) return;

    fetch(`${props.baseUrl}/api/admin/classes/${activeGroup.name}/students`, {
      method: "post",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionContext.token}`,
      },
      body: JSON.stringify({ user: username }),
    }).then((resp) => {
      if (resp.status === 200) {
        activeGroup?.students.push(username);
        forceUpdate();
      }
    });
  };

  return (
    <div className="h-100">
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          flexDirection: "column",
          paddingLeft: "10px",
        }}
      >
        <HeaderBar title="Teacher view">
          <React.Fragment>
            <Grid item key="reset-view">
              <Button
                onClick={() => {
                  allotmentRef.current?.reset();
                  onResultsSet([]);
                }}
              >
                Reset view
              </Button>
            </Grid>
          </React.Fragment>
        </HeaderBar>
        <InputDialog
          title="Add student"
          defaultValue=""
          inputLabel="username"
          onInputEntered={onAddStudent}
          okButtonLabel="Add"
          open={dialogState === "addStudent"}
          onClose={() => setDialogState("")}
        />
        <InputDialog
          type="combo"
          options={bookTitles}
          disabledOptions={bookTitlesInGroup}
          title="Add book"
          inputLabel="Book"
          onInputEntered={onAddBook}
          okButtonLabel="Add"
          open={dialogState === "addBook"}
          onClose={() => setDialogState("")}
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
                      value={activeBookTitle || null}
                      onChange={(e, n) => setActiveBookTitle(n || undefined)}
                      options={bookTitlesInGroup}
                      getOptionLabel={(option) => (option ? option : "")}
                      renderInput={(params) => (
                        <TextField {...params} label="Book" />
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
                {activeBookTitle ? (
                  <a
                    href={`${window.location.origin}?bk=${activeBookTitle}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {window.location.origin}?bk={activeBookTitle}
                  </a>
                ) : undefined}
                <ResultsTable
                  book={book}
                  bookTitle={activeBookTitle}
                  group={activeGroup}
                  updateCtr={updateCtr}
                  results={results}
                  onResultSelected={onResultSet}
                  onResultAdd={onResultAdd}
                  onResultsSelected={onResultsSet}
                />
                {activeGroup && book ? (
                  <IconButton
                    size="small"
                    onClick={() => setDialogState("addStudent")}
                  >
                    <AddIcon />
                    Add student
                  </IconButton>
                ) : undefined}
              </React.Fragment>
            )}
          </Container>

          <Box sx={{ overflow: "auto", height: "100%" }}>
            <ResultCodePane results={[...stagedResults.values()]} />
          </Box>
        </Allotment>
      </Box>
    </div>
  );
};

export default TeacherAdmin;
