import React, {useEffect} from 'react';
import {BrowserRouter, Routes, Route, useLocation} from "react-router-dom";
import Book from './book/Book'
import Challenge from './challenge/Challenge'

import './App.css';

function AppContainer() {
  const searchParams = new URLSearchParams(useLocation().search);
  const bookPath = searchParams.get('book')
  const challengePath = searchParams.get('ch');

  useEffect(() => {
  }, [bookPath, challengePath]);

  if (bookPath) { return (<Book/>) }
  else if (challengePath) {
        return (
          <React.Fragment>
            <Challenge guidePath={challengePath + ".md"} codePath={challengePath + ".py"}></Challenge>
          </React.Fragment>
      )
  } else {
    return (<p>Please specify a challenge (e.g. <a href="?ch=./progsoc/c01">?ch=./progsoc/c01</a>) or a book (e.g. <a href="?book=book.json">?book=book.json</a>)</p>)
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
