import { Autocomplete, Stack, TextField } from "@mui/material";
import { Container } from "@mui/system";
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
import { ClassModel, ResultsModel } from "./Models";
import ResultsTable from "./ResultsTable";

type TeacherAdminProps = {
  baseUrl: string;
};

const TeacherAdmin = (props: TeacherAdminProps) => {
  const session = useContext(SessionContext);

  const [groups, setGroups] = useState<Array<ClassModel>>([]);
  const [groupInputValue, setGroupInputValue] = React.useState("");
  const [activeGroup, setActiveGroup] = useState<ClassModel | undefined>(
    undefined
  );

  const [bookTitles, setBookTitles] = useState<Array<string>>([]);
  const [bookTitle, setBookTitle] = useState<string | undefined>(undefined);

  const [book, setBook] = useState<BookNodeModel | undefined | null>(undefined);
  const [bookFetcher, setBookFetcher] = useState<BookFetcher | undefined>(
    undefined
  );

  const [results, setResults] = useState<Array<ResultsModel>>([]);

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
          });
      }),
    [session.token, props.baseUrl]
  );

  useEffect(() => {
    request("api/admin/classes").then((data) => setGroups(data));
  }, [request]);

  useEffect(() => {
    console.log(groups);
  }, [groups]);

  useEffect(() => {
    if (!activeGroup) return;
    setBookTitles(activeGroup?.books || []);
    setBookTitle(undefined);
  }, [activeGroup]);

  useEffect(() => {
    if (!bookTitle || !activeGroup) {
      setBookFetcher(undefined);
      setBook(undefined);
      setResults([]);
      return;
    }
    setBookFetcher(new BookFetcher(bookTitle));
    request(
      `api/admin/classes/${activeGroup.name}/books/${encodeURIComponent(
        bookTitle
      )}/results`
    ).then(setResults);
  }, [bookTitle, request, activeGroup]);

  useEffect(() => {
    if (!bookFetcher) {
      setBook(undefined);
      return;
    }
    bookFetcher
      .fetchBook(session)
      .then((res) => setBook(res.book))
      .catch((e) => setBook(null));
  }, [bookFetcher, session]);

  return (
    <div>
      <HeaderBar title="Teacher view" />
      <Container sx={{ pt: 3 }}>
        <Stack spacing={2}>
          <Autocomplete
            value={activeGroup || null}
            onChange={(e, n) => setActiveGroup(n || undefined)}
            inputValue={groupInputValue}
            onInputChange={(e, newValue) => setGroupInputValue(newValue)}
            options={groups}
            getOptionLabel={(option) => (option ? option.name : "")}
            renderInput={(params) => <TextField {...params} label="Group" />}
          ></Autocomplete>
          <Autocomplete
            value={bookTitle || null}
            onChange={(e, n) => setBookTitle(n || undefined)}
            options={bookTitles}
            getOptionLabel={(option) => (option ? option : "")}
            renderInput={(params) => <TextField {...params} label="Book" />}
          />
        </Stack>
        <div>{book?.name}</div>
        <ResultsTable
          book={book || undefined}
          bookTitle={bookTitle}
          group={activeGroup}
          results={results}
        />
      </Container>
    </div>
  );
};

export default TeacherAdmin;
