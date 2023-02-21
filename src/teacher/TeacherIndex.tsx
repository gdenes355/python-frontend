import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import SessionContext from "../auth/SessionContext";
import Groups from "./Groups";
import Results from "./Results";

const TeacherIndex = () => {
  const searchParams = new URLSearchParams(useLocation().search);
  const book = searchParams.get("cb");
  const group = searchParams.get("group");

  if (book && group) {
    return <Results bookName={book} klassName={group} />;
  }

  return <Groups />;
};

export default TeacherIndex;
