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
    return (<p>Please specify a challenge (e.g. <a href="?ch=./progsoc/c01">?ch=./progsoc/c01</a>) or a book (e.g. <a href="?book=./progsoc/book.json">?book=./progsoc/book.json</a>)</p>)
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
