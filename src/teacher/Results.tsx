import React, { useContext, useEffect, useState } from "react";
import SessionContext from "../auth/SessionContext";

type ResultsProps = {
  bookName: string;
  klassName: string;
};

const Results = (props: ResultsProps) => {
  const session = useContext(SessionContext);

  const [results, setResults] = useState<any | undefined>();

  useEffect(() => {
    let headers = new Headers();
    headers.append("Authorization", `Bearer ${session.token}`);
    fetch(
      `http://localhost:5001/api/admin/classes/${props.klassName}/books/${props.bookName}/results`,
      { headers }
    )
      .then((data) => data.json())
      .then((data) => setResults(data.data));
  }, []);

  console.log(results);

  if (!results) {
    return <p>Loading results..</p>;
  }
  return (
    <React.Fragment>
      {results.map((r: any) => (
        <div key={r.user}>{r.user}</div>
      ))}
    </React.Fragment>
  );
};

export default Results;
