import React from "react";
import "./CanvasDisplay.css";
import RealTurtle from "real-turtle";
import {
  processCanvasCommand,
  processTurtleCommand,
  initialiseTurtle,
} from "./CanvasDisplayController";

type CanvasDisplayProps = {
  onKeyDown?: React.KeyboardEventHandler;
  onKeyUp?: React.KeyboardEventHandler;
};

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;

class CanvasDisplay extends React.Component<CanvasDisplayProps> {
  canvasEl = React.createRef<HTMLCanvasElement>();

  turtle: RealTurtle | null = null;
  turtleJustReset = false; // the turtle has been just reset, so no need to do this right now

  turtleReset(mode: "standard" | "logo") {
    const canvas = this.canvasEl.current as HTMLCanvasElement;
    this.turtle = initialiseTurtle(canvas, mode);
    this.turtleJustReset = true;
  }

  runTurtleCommand(msg: string) {
    if (!this.turtle || this.turtle.fake) {
      this.turtleReset("standard");
    }
    if (!this.turtle) {
      console.log("error?");
      return; // impossible to reach, reset should have created a turtle
    }

    const turtleObj = JSON.parse(msg);
    if (turtleObj.action === "reset") {
      if (!this.turtleJustReset) {
        this.turtleReset("standard");
      }
    } else if (turtleObj.action === "mode") {
      this.turtleReset(turtleObj.value);
    } else {
      this.turtleJustReset = false;
      processTurtleCommand(this.turtle, turtleObj);
    }
  }

  runCommand(msg: string) {
    const canvas: HTMLCanvasElement = document.getElementById(
      "canvasDisplay"
    ) as HTMLCanvasElement;

    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    const drawObjs = JSON.parse(msg);
    for (let drawObj of drawObjs) {
      processCanvasCommand(context, drawObj);
    }
  }

  render() {
    return (
      <div style={{ width: "100%", height: "100%" }} className="graphicsPane">
        <canvas
          id="canvasDisplay"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          ref={this.canvasEl}
          onKeyDown={this.props.onKeyDown}
          onKeyUp={this.props.onKeyUp}
          tabIndex={1}
          style={{ outline: "none" }}
        />
      </div>
    );
  }
}

export default CanvasDisplay;
