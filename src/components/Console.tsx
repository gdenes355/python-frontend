import React, {useState, useEffect, useRef, KeyboardEvent, MouseEvent } from 'react';
import {Box} from '@mui/material';
import './Console.css'


type ConsoleProps = {
  isInputEnabled: boolean,
  content: string,
  onInput: (input: string) => void,
  onInterrupt: () => void,
};

const Console = (props: ConsoleProps) => {
  const [inputValue, setInputValue] = useState("");
  const containerEl = useRef<HTMLDivElement>(null);
  const inputFieldEl = useRef<HTMLInputElement>(null);

  const onKeyPressed = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      let input = inputValue;
      setInputValue("");
      props.onInput(input);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    let char = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && char === 'c') {
      // for Ctrl+C or Cmd+C
      event.preventDefault();
      props.onInterrupt();
    }
  };

  const onClick = (event: MouseEvent) => {
    if (inputFieldEl.current != null) {
      inputFieldEl.current.focus()
    } 
  };

  useEffect(() => {
    if (containerEl.current) {
      containerEl.current.scrollTop = containerEl.current.scrollHeight;
    }
  }, [props]);
  
  
  return (
    <Box sx={{width:"100%", height:"100%", bgcolor: "black"}}>
      <div className="console" ref={containerEl} onClick={onClick}>
        {props.content.replace(/\n{1}$/, "").split("\n").map((line,key) => {
            return <pre key={key}>{line}</pre>;
        })}
        <input ref={inputFieldEl}
          className={!props.isInputEnabled ? 'hidden' : undefined}
          autoFocus 
          autoComplete="off"
          type="text" 
          value={inputValue} 
          onChange={event => setInputValue(event.target.value)} 
          onKeyPress={onKeyPressed}
          onKeyDown={onKeyDown}>
        </input>
        </div>
    </Box>
    );
  }

  export default Console;
