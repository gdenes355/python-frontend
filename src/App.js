import React from 'react';
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Book from './Book'

import './App.css';

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Book/>} />
      </Routes>
    </BrowserRouter>
  )
}
