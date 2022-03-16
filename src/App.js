import React, {useEffect} from 'react';
import {BrowserRouter, Routes, Route, useLocation} from "react-router-dom";
import Book from './book/Book'
import Challenge from './challenge/Challenge'
import { ThemeProvider, createTheme } from '@mui/material/styles';

import './App.css';

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        }
      }
    },
  },
  palette: {
    primary: {
      main: '#0a9396',
    },
    secondary: {
      main: '#e9d8a6',
    },
  },
});

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
    return (<p>Please specify a challenge (e.g. <a href="?ch=./progsoc/c01">?ch=./progsoc/c01</a>) or a book (e.g. <a href="?book=./progsoc/book.json">?book=./progsoc/book.json</a>)</p>)
  }
}

export default function App() {

  return ( 
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path='*' element={<AppContainer></AppContainer>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
