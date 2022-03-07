import React from 'react';
import Challenge from './components/Challenge'
import './App.css';

class App extends React.Component {
    render() {
        return (
          <Challenge guidePath="guide.md" codePath="c01.py"></Challenge>
        )
    }
}
  
export default App;