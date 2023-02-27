import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid,
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
import HeaderBar from "../components/HeaderBar";
import BookNodeModel from "../models/BookNodeModel";
import {
  ClassModel,
  ResultsModel,
  ChallengeResultComplexModel,
} from "./Models";
import ResultCodePane from "./ResultCodePane";
import ResultsTable from "./ResultsTable";

type TeacherAdminProps = {
  baseUrl: string;
};

const TeacherAdmin = (props: TeacherAdminProps) => {
  console.log("drawing TeacherAdmin");
  const session = useContext(SessionContext);

  const [groups, setGroups] = useState<Array<ClassModel>>([]);
  const [groupInputValue, setGroupInputValue] = React.useState("");
  const [activeGroup, setActiveGroup] = useState<ClassModel | undefined>(
    undefined
  );

  const [bookTitles, setBookTitles] = useState<Array<string>>([]);
  const [bookTitle, setBookTitle] = useState<string | undefined>(undefined);

  const [book, setBook] = useState<BookNodeModel | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [bookFetcher, setBookFetcher] = useState<BookFetcher | undefined>(
    undefined
  );

  const [results, setResults] = useState<Array<ResultsModel>>([]);

  const [stagedResults, setStagedResults] = useState<
    Map<string, ChallengeResultComplexModel>
  >(new Map());

  const allotmentRef = useRef<AllotmentHandle>(null);

  const requestRef = useRef<Map<string, any>>(new Map());
  const request = useCallback(
    (req: string) =>
      new Promise<any>((res, rej) => {
        console.log("fetching " + req);
        let cached = requestRef.current.get(req);
        if (cached) {
          console.log("from cache");
          res(cached);
        }
        let headers = new Headers();
        headers.append("Authorization", `Bearer ${session.token}`);
        fetch(`${props.baseUrl}/${req}`, { headers })
          .then((data) => data.json())
          .then((data) => {
            requestRef.current.set(req, data.data);
            res(data.data);
          })
          .catch((e) => rej(`Failed to fetch ${req}`));
      }),
    [session.token, props.baseUrl]
  );

  useEffect(() => {
    console.log("[request]", request);
    request("api/admin/classes").then((data) => setGroups(data));
  }, [request]);

  useEffect(() => {
    console.log("[activeGroup]", activeGroup);
    if (!activeGroup) return;
    setBookTitles(activeGroup?.books || []);
    setBookTitle(undefined);
  }, [activeGroup]);

  useEffect(() => {
    console.log(
      "[bookTitle,request,activeGroup]",
      bookTitle,
      activeGroup,
      request,
      session.token,
      props.baseUrl
    );
    setError(undefined);

    if (!bookTitle || !activeGroup) {
      setBookFetcher(undefined);
      setResults([]);
      return;
    }

    setBookFetcher(new BookFetcher(bookTitle));
    request(
      `api/admin/classes/${activeGroup.name}/books/${encodeURIComponent(
        bookTitle
      )}/results`
    )
      .then(setResults)
      .catch((e) => setError(e.reason));
  }, [bookTitle, request, activeGroup]);

  useEffect(() => {
    console.log("[bookFetcher, session, error]");
    if (!bookFetcher) {
      setBook(undefined);
      return;
    }
    if (error) {
      return;
    }
    bookFetcher
      .fetchBook(session)
      .then((res) => setBook(res.book))
      .catch((e) => {
        setBook(undefined);
        setError("Failed to load book from server");
      });
  }, [bookFetcher, session, error]);

  const onResultAdd = useCallback(
    (res: ChallengeResultComplexModel) => {
      let key = `${res.student}-${res.id}`;
      if (stagedResults.has(key)) return;
      stagedResults.set(key, res);
      setStagedResults(new Map(stagedResults)); // trigger update
    },
    [stagedResults]
  );

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
                }}
              >
                Reset view
              </Button>
            </Grid>
          </React.Fragment>
        </HeaderBar>
        <Allotment defaultSizes={[650, 350]} minSize={3} ref={allotmentRef}>
          <Container sx={{ pt: 3, overflow: "auto", height: "100%" }}>
            {groups.length ? (
              <Stack spacing={2}>
                <Autocomplete
                  size="small"
                  value={activeGroup || null}
                  onChange={(e, n) => setActiveGroup(n || undefined)}
                  inputValue={groupInputValue}
                  onInputChange={(e, newValue) => setGroupInputValue(newValue)}
                  options={groups}
                  getOptionLabel={(option) => (option ? option.name : "")}
                  renderInput={(params) => (
                    <TextField {...params} label="Group" />
                  )}
                />

                <Autocomplete
                  size="small"
                  value={bookTitle || null}
                  onChange={(e, n) => setBookTitle(n || undefined)}
                  options={bookTitles}
                  getOptionLabel={(option) => (option ? option : "")}
                  renderInput={(params) => (
                    <TextField {...params} label="Book" />
                  )}
                />
              </Stack>
            ) : (
              <CircularProgress />
            )}

            {error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <React.Fragment>
                <h2>{book?.name}&nbsp;</h2>
                <ResultsTable
                  book={book}
                  bookTitle={bookTitle}
                  group={activeGroup}
                  results={results}
                  onResultSelected={onResultSet}
                  onResultAdd={onResultAdd}
                  onResultsSelected={onResultsSet}
                />
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
