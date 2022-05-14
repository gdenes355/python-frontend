import React, { useContext, useRef, useImperativeHandle } from "react";
import "./CanvasDisplay.css";
import RealTurtle from "real-turtle";
import { processCanvasCommand } from "./CanvasController";
import { processTurtleCommand, initialiseTurtle } from "./TurtleController";

import ChallengeContext from "../../ChallengeContext";

type CanvasDisplayHandle = {
  turtleReset: (mode: "standard" | "logo") => void;
  runTurtleCommand: (msg: string) => void;
  runAudioCommand: (msg: string) => void;  
  runCommand: (commands: any[]) => void;
};

type CanvasDisplayProps = {
  onKeyDown?: React.KeyboardEventHandler;
  onKeyUp?: React.KeyboardEventHandler;
};

const CanvasDisplay = React.forwardRef<CanvasDisplayHandle, CanvasDisplayProps>(
  (props, ref) => {
    const canvasEl = useRef<HTMLCanvasElement>(null);
    const challengeContext = useContext(ChallengeContext);

    const turtle = useRef<RealTurtle | null>(null);
    const turtleJustReset = useRef(false); // the turtle has been just reset, so no need to do this right now

    const turtleReset = (mode: "standard" | "logo") => {
      const canvas = canvasEl.current as HTMLCanvasElement;
      turtle.current = initialiseTurtle(canvas, mode);
      turtleJustReset.current = true;
    };

    const runTurtleCommand = (msg: string) => {
      if (!turtle.current || turtle.current?.fake) {
        turtleReset("standard");
      }
      if (!turtle.current) {
        console.log("error?");
        return; // impossible to reach, reset should have created a turtle
      }

      const turtleObj = JSON.parse(msg);
      if (turtleObj.action === "reset") {
        if (!turtleJustReset.current) {
          turtleReset("standard");
        }
      } else if (turtleObj.action === "mode") {
        turtleReset(turtleObj.value);
      } else {
        turtleJustReset.current = false;
        processTurtleCommand(turtle.current, turtleObj);
      }
    };

    const runAudioCommand = (msg: string) => {
      const audio: HTMLAudioElement = document.getElementById(
        "audio"
      ) as HTMLAudioElement;

      const audioSource: HTMLSourceElement = document.getElementById(
        "audioSource"
      ) as HTMLSourceElement;      

      const audioObj = JSON.parse(msg);

      if(audioObj.action === "load") {
        audioSource.src = audioObj.source;
        audio.load();
      } else if(audioObj.action === "load") {
        audio.play();
      }

    };    

    const runCommand = (commands: any[]) => {
      const canvas: HTMLCanvasElement = document.getElementById(
        "canvasDisplay"
      ) as HTMLCanvasElement;

      const context = canvas.getContext("2d") as CanvasRenderingContext2D;

      for (let drawObj of commands) {
        processCanvasCommand(context, drawObj);
      }
    };

    useImperativeHandle(ref, () => ({
      runCommand,
      runTurtleCommand,
      runAudioCommand,
      turtleReset,
    }));

    return (
      <div style={{ width: "100%", height: "100%" }} className="graphicsPane">
        <canvas
          id="canvasDisplay"
          width={500}
          height={400}
          ref={canvasEl}
          onKeyDown={challengeContext?.actions["canvas-keydown"]}
          onKeyUp={challengeContext?.actions["canvas-keyup"]}
          tabIndex={1}
          style={{ outline: "none" }}
        />
        <audio style={{display:'none'}} id="audio">
          <source id="audioSource" src=""></source>
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }
);

export default CanvasDisplay;
export { CanvasDisplayHandle };
