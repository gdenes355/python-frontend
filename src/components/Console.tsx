import React, { useEffect, useRef, KeyboardEvent, MouseEvent } from "react";
import { Box } from "@mui/material";
import "./Console.css";

type ConsoleProps = {
  isInputEnabled: boolean;
  content: string;
  onInput: (input: string) => void;
  onInterrupt: () => void;
};

const Console = (props: ConsoleProps) => {
  const containerEl = useRef<HTMLDivElement>(null);
  const inputFieldEl = useRef<HTMLInputElement>(null);

  const onKeyPressed = (event: KeyboardEvent) => {
    if (inputFieldEl.current && event.key === "Enter") {
      let input = inputFieldEl.current.textContent;
      props.onInput(input || "");
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
      // for Ctrl+C or Cmd+C
      event.preventDefault();
      props.onInterrupt();
    }
  };

  const onClick = (event: MouseEvent) => {
    if (props.isInputEnabled) {
      inputFieldEl.current?.focus();
    }
  };

  useEffect(() => {
    if (containerEl.current) {
      containerEl.current.scrollTop = containerEl.current.scrollHeight;
    }
  }, [props]);

  useEffect(() => {
    if (props.isInputEnabled && inputFieldEl.current) {
      inputFieldEl.current.textContent = "";
      inputFieldEl.current?.focus();
    }
  }, [props.isInputEnabled]);

  return (
    <Box sx={{ width: "100%", height: "100%", bgcolor: "black" }}>
      <div className="console" ref={containerEl} onClick={onClick}>
        <span className="printed-span">
          {props.content.replace("\n", "NL\r\n")}
        </span>
        <span
          className={!props.isInputEnabled ? "input-span hidden" : "input-span"}
          ref={inputFieldEl}
          role="textbox"
          onKeyPress={onKeyPressed}
          onKeyDown={onKeyDown}
          contentEditable
        ></span>
      </div>
    </Box>
  );
};

export default Console;
