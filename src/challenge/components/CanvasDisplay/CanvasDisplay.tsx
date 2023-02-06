import React, { useContext, useRef, useImperativeHandle } from "react";
import "./CanvasDisplay.css";
import { processCanvasCommand } from "./CanvasController";
import { processTurtleCommand, clearTurtle } from "./TurtleController";

import ChallengeContext from "../../ChallengeContext";
import AsyncQueue from "../../../utils/AsyncQueue";

type CanvasDisplayHandle = {
  turtleClear: () => void;
  runTurtleCommand: (id: number, msg: string) => void;
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

    const turtleInstructionQueue = useRef<AsyncQueue>(new AsyncQueue());

    const turtleClear = () => {
      turtleInstructionQueue.current?.reset();
      clearTurtle(canvasEl.current as HTMLCanvasElement);
    };

    const runTurtleCommand = (id: number, msg: string) => {
      const turtleObj = JSON.parse(msg);
      turtleInstructionQueue.current.addItem(() =>
        processTurtleCommand(
          id,
          turtleObj,
          canvasEl.current as HTMLCanvasElement
        )
      );
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
      turtleClear,
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
