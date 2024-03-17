import React, {
  useEffect,
  useRef,
  KeyboardEvent,
  MouseEvent,
  useContext,
  useState,
} from "react";
import { Box } from "@mui/material";
import "./Console.css";
import VsThemeContext from "../themes/VsThemeContext";
import Anser from "anser";
import parse from "html-react-parser";

type ConsoleProps = {
  isInputEnabled: boolean;
  content: string;
  onInput: (input: string) => void;
  onInterrupt: () => void;
};

// max character count in the console
const MAX_LENGTH = 1000000;

const transformText = (text: string) => {
  text = text.replace("\n", "\r\n");
  text = text.slice(-MAX_LENGTH);
  if (text.includes("\u001b")) {
    return parse(Anser.ansiToHtml(text));
  }
  return text;
};

const Console = (props: ConsoleProps) => {
  const containerEl = useRef<HTMLDivElement | null>(null);
  const inputFieldEl = useRef<HTMLInputElement>(null);
  const vsThemeContext = useContext(VsThemeContext);

  const [fontSize, setFontSize] = useState<number>(15);

  const onKeyPressed = (event: KeyboardEvent) => {
    if (inputFieldEl.current && event.key === "Enter") {
      let input = inputFieldEl.current.textContent;
      inputFieldEl.current.textContent = "";
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

  const onWheel = (event: WheelEvent) => {
    if (event && event.ctrlKey) {
      if (event.deltaY > 0) {
        setFontSize((prev) => Math.max(2, prev - 1));
      } else {
        setFontSize((prev) => Math.min(72, prev + 1));
      }
      event.preventDefault();
    }
  };

  useEffect(() => {
    if (props.isInputEnabled && inputFieldEl.current) {
      inputFieldEl.current.textContent = "";
      inputFieldEl.current?.focus();
    }
  }, [props.isInputEnabled]);

  const setRef = (el: HTMLDivElement) => {
    if (containerEl.current) {
      containerEl.current.removeEventListener("wheel", onWheel);
    }
    if (el) el.addEventListener("wheel", onWheel, { passive: false });
    containerEl.current = el;
  };

  if (props.isInputEnabled) {
    inputFieldEl.current?.focus();
  }

  return (
    <Box sx={{ width: "100%", height: "100%", bgcolor: "background.default" }}>
      <div
        className={"console theme-" + vsThemeContext.theme}
        ref={setRef}
        onClick={onClick}
        style={{ fontSize: fontSize + "px" }}
      >
        <span className="printed-span">{transformText(props.content)}</span>
        <span
          className={!props.isInputEnabled ? "input-span hidden" : "input-span"}
          ref={inputFieldEl}
          role="textbox"
          title="console textbox"
          onKeyPress={onKeyPressed}
          onKeyDown={onKeyDown}
          contentEditable
        ></span>
      </div>
    </Box>
  );
};

export default Console;
