import { useContext, useEffect, useState } from "react";
import SessionContext from "../auth/contexts/SessionContext";
import { Alert, Button, Container, ListItemButton } from "@mui/material";
import HeaderBar from "../components/HeaderBar";
import { useNavigate } from "react-router-dom";

type StudentDashboardProps = {
  baseUrl: string;
};

type DashboardBook = {
  path: string;
  title: string;
};

const StudentDashboard = (props: StudentDashboardProps) => {
  const { baseUrl } = props;

  const authContext = useContext(SessionContext);
  const [token, setToken] = useState("");

  const [error, setError] = useState("");

  const [books, setBooks] = useState<DashboardBook[] | undefined>(undefined);

  const navigate = useNavigate();

  useEffect(() => {
    if (books) return;
    if (!authContext.token || authContext.token !== token) {
      setToken(authContext.token);
      let headers = new Headers();
      headers.append("Authorization", `Bearer ${authContext.token}`);
      fetch(`${baseUrl}/api/student-dashboard`, { headers })
        .then((response) => {
          if (response.status === 200) {
            response.json().then((data) => {
              let mappedData = data.books?.map((book: any) => {
                return { path: book.path, title: book.title || book.path };
              });
              mappedData = mappedData?.sort(
                (a: DashboardBook, b: DashboardBook) =>
                  a.title.localeCompare(b.title)
              );
              setBooks(mappedData);
            });
          } else if (response.status === 401) {
            response.json().then((data) => {
              authContext.login({
                clientId: data.clientId,
                tenantId: data.tenantId || "common",
                authProvider: data.auth_provider || "MSAL",
                jwtEndpoint: data.jwtEndpoint,
                startUrl: baseUrl + "/dashboard",
                resultsEndpoint: data.resultsEndpoint,
                wsEndPoint: data.wsEndPoint,
                bookPath: baseUrl + "/dashboard",
              });
            });
          } else {
            setError(
              `Unexpected response code from server: ${response.status}`
            );
          }
        })
        .catch((e) => {
          setError(e.toString());
        });
      return;
    }
  }, [authContext, baseUrl, books, token]);

  const openBook = (bookPath: string) => {
    navigate(`/?bk=${bookPath}`);
  };

  return (
    <>
      <HeaderBar title="My Python Sponge books" />
      <Container>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : books?.length === 0 ? (
          <p>You don't have any books available at the moment.</p>
        ) : (
          books?.map((book) => (
            <ListItemButton key={book.path} onClick={() => openBook(book.path)}>
              {book.title}
            </ListItemButton>
          ))
        )}
        {authContext.isTeacher ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/teacher")}
          >
            Teacher Dashboard
          </Button>
        ) : undefined}
      </Container>
    </>
  );
};

export default StudentDashboard;
