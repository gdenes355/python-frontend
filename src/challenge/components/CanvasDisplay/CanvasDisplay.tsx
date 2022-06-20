import React, { useContext, useRef, useImperativeHandle } from "react";
import "./CanvasDisplay.css";
import RealTurtle from "real-turtle";
import { processCanvasCommand } from "./CanvasController";
import { processTurtleCommand, initialiseTurtle } from "./TurtleController";

import ChallengeContext from "../../ChallengeContext";
import AsyncQueue from "../../../utils/AsyncQueue";

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

    const turtleInstructionQueue = useRef<AsyncQueue<RealTurtle>>(
      new AsyncQueue<RealTurtle>()
    );

    const turtleReset = (mode: "standard" | "logo") => {
      turtleInstructionQueue.current.reset(() =>
        initialiseTurtle(canvasEl.current as HTMLCanvasElement, mode)
      );
    };

    const runTurtleCommand = (msg: string) => {
      const turtleObj = JSON.parse(msg);
      if (turtleObj.action === "reset") {
        if (!turtleInstructionQueue.current.isFresh()) {
          turtleReset("standard");
        }
      } else if (turtleObj.action === "mode") {
        console.log("mode?");
        turtleReset(turtleObj.value);
      } else {
        turtleInstructionQueue.current.addItem((t) =>
          processTurtleCommand(t, turtleObj)
        );
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

      if (audioObj.action === "load") {
        audioSource.src = audioObj.source;
        audio.load();
      } else if (audioObj.action === "play") {
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
        <audio style={{ display: "none" }} id="audio" crossOrigin="anonymous">
          <source id="audioSource" src=""></source>
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }
);

export default CanvasDisplay;
export { CanvasDisplayHandle };
