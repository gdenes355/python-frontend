import React, {
  useContext,
  useRef,
  useImperativeHandle,
  useState,
} from "react";
import "./CanvasDisplay.css";
import { processCanvasCommand } from "./CanvasController";
import {
  processTurtleCommand,
  resizeScreen,
  setVirtualMode,
} from "./TurtleController";

import ChallengeContext from "../../../ChallengeContext";

type CanvasDisplayHandle = {
  turtleReset: (virtual?: boolean) => void;
  runTurtleCommand: (id: number, msg: string) => Promise<string | void>;
  runTurtleClearup: () => void;
  runCommand: (commands: any[]) => void;
};

type CanvasDisplayProps = {
  initialWidth: number;
  initialHeight: number;
};

const CanvasDisplay = React.forwardRef<CanvasDisplayHandle, CanvasDisplayProps>(
  (props, ref) => {
    const [dimensions, setDimensions] = useState<{
      width: number;
      height: number;
    }>({
      width: props.initialWidth,
      height: props.initialHeight,
    });

    const [zoom, setZoom] = useState(1);

    const canvasEl = useRef<HTMLCanvasElement>(null);
    const divEl = useRef<HTMLDivElement | null>(null);
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
        return new Promise<void>((r) => {
          r();
        });
      } else if (turtleObj.action === "setup") {
        setDimensions({
          width: turtleObj.width,
          height: turtleObj.height,
        });
        resizeScreen(turtleObj.width, turtleObj.height);
        processTurtleCommand(
          id,
          { action: "reset" },
          canvasEl.current as HTMLCanvasElement
        );
        return Promise.resolve();
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

    const onWheel = (event: WheelEvent) => {
      if (event && event.ctrlKey) {
        if (event.deltaY > 0) {
          setZoom((prev) => Math.max(0.5, prev - 0.1));
        } else {
          setZoom((prev) => Math.min(2, prev + 0.1));
        }
        event.preventDefault();
      }
    };

    useImperativeHandle(ref, () => ({
      runCommand,
      runTurtleCommand,
      runTurtleClearup: turtleClearup,
      turtleReset,
    }));

    const setDivRef = (el: HTMLDivElement) => {
      if (divEl.current) {
        divEl.current.removeEventListener("wheel", onWheel);
      }
      if (el) {
        el.addEventListener("wheel", onWheel, { passive: false });
        divEl.current = el;
      }
    };

    return (
      <div
        ref={setDivRef}
        style={{ width: "100%", height: "100%" }}
        className="graphicsPane"
      >
        <canvas
          id="canvasDisplay"
          width={dimensions.width}
          height={dimensions.height}
          ref={canvasEl}
          onKeyDown={challengeContext?.actions["canvas-keydown"]}
          onKeyUp={challengeContext?.actions["canvas-keyup"]}
          tabIndex={1}
          style={{
            outline: "none",
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
          }}
        />
      </div>
    );
  }
);

export default CanvasDisplay;
export { CanvasDisplayHandle };
