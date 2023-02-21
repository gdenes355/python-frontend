import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SessionContext from "../auth/SessionContext";

const Groups = () => {
  const session = useContext(SessionContext);
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Array<any>>([]);

  const [klass, setKlass] = useState<any | undefined>(undefined);

  useEffect(() => {
    let headers = new Headers();
    headers.append("Authorization", `Bearer ${session.token}`);
    fetch("http://localhost:5001/api/admin/classes", { headers })
      .then((data) => data.json())
      .then((data) => setClasses(data.data));
  }, []);

  const selectBook = (b: string) => {
    navigate(`/teacher/?cb=${b}&group=${klass.name}`);
  };

  if (!klass) {
    return (
      <React.Fragment>
        {classes.map((cl) => (
          <div key={cl.name} onClick={() => setKlass(cl)}>
            {cl.name} ({cl.students.length} students)
          </div>
        ))}
      </React.Fragment>
    );
  } else {
    return (
      <React.Fragment>
        {klass.name}
        <h3>Books</h3>
        {klass.books.map((b: any) => (
          <div onClick={() => selectBook(b)}>{b}</div>
        ))}
      </React.Fragment>
    );
  }
};

export default Groups;
