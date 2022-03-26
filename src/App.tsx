import React from 'react';
import {BrowserRouter, Routes, Route, useLocation} from "react-router-dom";
import BookFragment from './book/BookFragment'
import Challenge from './challenge/Challenge'
import { ThemeProvider } from '@mui/material/styles';

import pageTheme from './themes/pageTheme'

import './App.css';

const AppContainer = () => {
  const searchParams = new URLSearchParams(useLocation().search);
  const bookPath = searchParams.get('book')
  const challengePath = searchParams.get('ch');
  
  if (bookPath) { 
    return (<BookFragment/>) 
  }
  else if (challengePath) {
        return (
          <React.Fragment>
                <Challenge 
                  guidePath={challengePath + ".md"} 
                  codePath={challengePath + ".py"} 
                  hasBook={false}
                  layout="linear"/>
          </React.Fragment>
      )
  } else {
    return (
    <p>
      To get started,just specify the book path. E.g.
      <ul>
        <li>Simple examples with test cases: <a href="?book=./examples/book.json">?book=./examples/book.json</a></li>
        <li>Fun tasks: <a href="?book=./progsoc/book.json">?book=./progsoc/book.json</a></li>
        <li><b>New: </b> You can also specify a library of books: <a href="?book=./library.json">?book=./library.json</a></li>
      </ul>
      Alternatively, you can view an individual challenge using the md and py paths: (e.g. <a href="?book=./progsoc/book.json">?book=./progsoc/book.json</a>)</p>)
  }
}

export default function App() {

  return ( 
    <ThemeProvider theme={pageTheme}>
      <BrowserRouter>
        <Routes>
          <Route path='*' element={<AppContainer></AppContainer>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
