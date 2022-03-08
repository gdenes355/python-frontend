import React from 'react';
import {Box} from '@mui/material';
import './Console.css'

class Console extends React.Component {

    constructor(props) {
      super(props);
      this.container = React.createRef();
      this.inputField = React.createRef();
      this.state = {inputValue: ""}
      this.onKeyPressed.bind(this)
    } 
  
    onKeyPressed = (event) => {
      if (event.key === "Enter") {
        let input = this.state.inputValue;
        this.setState({inputValue: ""})
        this.props.onInput(input)
      }
    }
  
    componentDidUpdate() {
      this.container.current.scrollTop = this.container.current.scrollHeight;
    }
  
    render() {
      return (
        <Box sx={{width:"100%", height:"100%", bgcolor: "black"}}>
        <div className="console" ref={this.container} onClick={(evt) => {return this.inputField.current != null ? this.inputField.current.focus() : null}}>
  
          <div style={this.style}>
          {this.props.content.replace(/\n{1}$/, "").split("\n").map((i,key) => {
              return <pre key={key}>{i}</pre>;
          })}
          </div>
            <input ref={this.inputField}
              className={!this.props.isInputEnabled ? 'hidden' : undefined}
              autoFocus 
              style={this.style}
              autoComplete="off"
              type="text" 
              value={this.state.inputValue} 
              onChange={event => this.setState({inputValue: event.target.value})} 
              onKeyPress={this.onKeyPressed}>
            </input>
        </div>
        </Box>
      )
    }
  }

  export default Console;