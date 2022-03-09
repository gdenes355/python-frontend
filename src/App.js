import React, {useEffect} from 'react';
import {BrowserRouter, Routes, Route, useLocation} from "react-router-dom";
import Book from './Book'
import Challenge from './Challenge'

import './App.css';

function AppContainer() {
  const searchParams = new URLSearchParams(useLocation().search);
  const bookPath = searchParams.get('book')
  const challengeNum = searchParams.get('ch');

  useEffect(() => {

  }, [bookPath, challengeNum]);

  if (bookPath) { return (<Book/>) }
  else if (challengeNum) {
        return (
          <Challenge guidePath={"c" + challengeNum + ".md"} codePath={"c" + challengeNum + ".py"}></Challenge>
      )
  } else {
    return (<p>Please specify a challenge (e.g. <a href="?ch=01">?ch=01</a>) or a book (e.g. <a href="?book=book.json">?book=book.json</a>)</p>)
  }
}

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='*' element={<AppContainer></AppContainer>} />
      </Routes>
    </BrowserRouter>
  )
}
