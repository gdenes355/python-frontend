import React, { useContext, useRef, useImperativeHandle } from "react";
import "./CanvasDisplay.css";
import { processCanvasCommand } from "./CanvasController";
import { processTurtleCommand, setVirtualMode } from "./TurtleController";

import ChallengeContext from "../../../ChallengeContext";

type CanvasDisplayHandle = {
  turtleReset: (virtual?: boolean) => void;
  runTurtleCommand: (id: number, msg: string) => Promise<string | void>;
  runTurtleClearup: () => void;
  runCommand: (commands: any[]) => void;
};

type CanvasDisplayProps = {};

const CanvasDisplay = React.forwardRef<CanvasDisplayHandle, CanvasDisplayProps>(
  (props, ref) => {
    const canvasEl = useRef<HTMLCanvasElement>(null);
    const challengeContext = useContext(ChallengeContext);
    const turtleUsed = useRef<boolean>(false);
    const turtleRetained = useRef<boolean>(false);

    // used after run to hide turtle if it was not retained by turtle.done()
    const turtleClearup = () => {
      if (turtleUsed.current && !turtleRetained.current) {
        challengeContext?.actions["hide-turtle"]();
      }
      turtleUsed.current = false;
      turtleRetained.current = false;
    };

    // used to reset turtle (also to specified virtual mode)
    const turtleReset = (virtual = false) => {
      setVirtualMode(canvasEl.current as HTMLCanvasElement, virtual);
      turtleUsed.current = false;
      turtleRetained.current = false;
    };

    const runTurtleCommand = (id: number, msg: string) => {
      turtleUsed.current = true;
      const turtleObj = JSON.parse(msg);
      if (turtleObj.action === "done") {
        turtleRetained.current = true;
        return new Promise<void>((r, e) => {
          r();
        });
      }
      return processTurtleCommand(
        id,
        turtleObj,
        canvasEl.current as HTMLCanvasElement
      );
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
      runTurtleClearup: turtleClearup,
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
      </div>
    );
  }
);

export default CanvasDisplay;
export { CanvasDisplayHandle };
