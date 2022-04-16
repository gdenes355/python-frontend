import React from "react";
import "./CanvasDisplay.css";
import RealTurtle from "real-turtle";

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;
const TURTLE_SIZE_DEFAULT = 15;
const TURTLE_WIDTH_DEFAULT = 1;
const TURTLE_SPEED_DEFAULT = 0.5;
const TURTLE_STROKE_DEFAULT = "BLACK";
const TURTLE_CIRCLE_CCW_DEFAULT = true;
const TURTLE_STANDARD_MODE_BEARING = 90;

class CanvasDisplay extends React.Component {
  canvasEl = React.createRef<HTMLCanvasElement>();

  turtle: RealTurtle | null = null;
  turtleJustReset = false; // the turtle has been just reset, so no need to do this right now
  heading = 0;
  mode: "standard" | "logo" = "standard";

  turtleReset() {
    const canvas = this.canvasEl.current as HTMLCanvasElement;
    this.turtle = new RealTurtle(canvas, { autoStart: true });
    if (!this.turtle) {
      console.log("failed to create turtle");
      return;
    }
    this.turtle.setPosition(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.turtle.right(TURTLE_STANDARD_MODE_BEARING); // for standard mode
    this.heading = 0;
    this.mode = "standard";
    this.turtle.setSize(TURTLE_SIZE_DEFAULT);
    this.turtle.setLineWidth(TURTLE_WIDTH_DEFAULT);
    this.turtle.setSpeed(TURTLE_SPEED_DEFAULT);
    this.turtle.setStrokeStyle(TURTLE_STROKE_DEFAULT);
    this.turtleJustReset = true;
  }

  runTurtleCommand(msg: string) {
    if (!this.turtle || this.turtle.fake) {
      this.turtleReset();
    }
    if (!this.turtle) {
      console.log("error?");
      return; // impossible to reach, reset should have created a turtle
    }

    try {
      const turtleObj = JSON.parse(msg);
      if (turtleObj.action === "reset" && this.turtleJustReset) {
        // skip immediate resets
        return;
      }
      this.turtleJustReset = false;
      switch (turtleObj.action) {
        case "forward":
          this.turtle.forward(turtleObj.value);
          break;
        case "backward":
          this.turtle.back(turtleObj.value);
          break;
        case "right":
          this.turtle.right(turtleObj.value);
          this.mode === "logo"
            ? (this.heading = this.heading + turtleObj.value)
            : (this.heading = this.heading - turtleObj.value);
          break;
        case "left":
          this.turtle.left(turtleObj.value);
          this.mode === "logo"
            ? (this.heading = this.heading - turtleObj.value)
            : (this.heading = this.heading + turtleObj.value);
          break;
        case "setposition":
          this.turtle.setPosition(
            turtleObj.x + CANVAS_WIDTH / 2,
            turtleObj.y + CANVAS_HEIGHT / 2
          );
          break;
        case "penup":
          this.turtle.penUp();
          break;
        case "pendown":
          this.turtle.penDown();
          break;
        case "pensize":
          this.turtle.setLineWidth(turtleObj.value);
          break;
        case "setheading":
          const turn = turtleObj.value - this.heading;
          if (turn !== 0) {
            if (this.mode === "logo") {
              this.turtle.right(turn);
            } else {
              // standard
              this.turtle.left(turn);
            }
            this.heading = turtleObj.value;
          }
          break;
        case "hideturtle":
          this.turtle.setSize(0);
          break;
        case "showturtle":
          this.turtle.setSize(TURTLE_SIZE_DEFAULT); // default
          break;
        case "pencolor":
          if (
            typeof turtleObj.value === "string" ||
            turtleObj.value instanceof String
          ) {
            this.turtle.setStrokeStyle(turtleObj.value); // a named color as string or html code
          } else {
            this.turtle.setStrokeStyle(
              `rgb(${turtleObj.value[0]},${turtleObj.value[1]},${turtleObj.value[2]})`
            ); // color tuple
          }
          break;
        case "circle":
          this.turtle.arc(
            turtleObj.radius,
            turtleObj.extent,
            TURTLE_CIRCLE_CCW_DEFAULT
          ); // set counterclockwise to true for standard mode
          this.mode === "logo"
            ? (this.heading = this.heading - turtleObj.extent)
            : (this.heading = this.heading + turtleObj.extent);
          break;
        case "begin_fill":
          this.turtle.beginPath();
          break;
        case "end_fill":
          this.turtle.closePath();
          this.turtle.fill();
          break;
        case "fillcolor":
          if (
            typeof turtleObj.value === "string" ||
            turtleObj.value instanceof String
          ) {
            this.turtle.setFillStyle(turtleObj.value); // a named color as string or html code
          } else {
            this.turtle.setFillStyle(
              `rgb(${turtleObj.value[0]},${turtleObj.value[1]},${turtleObj.value[2]})`
            ); // color tuple
          }
          break;
        case "speed":
          let speed_val = 0.5;
          switch (turtleObj.value) {
            case "fastest":
              speed_val = 0.9;
              break;
            case "fast":
              speed_val = 0.75;
              break;
            case "normal":
              speed_val = 0.5;
              break;
            case "slow":
              speed_val = 0.25;
              break;
            case "slowest":
              speed_val = 0;
              break;
            default:
              speed_val = turtleObj.value === 0 ? 1 : turtleObj.value / 10;
          }

          this.turtle.setSpeed(speed_val);
          break;
        case "reset":
          this.turtleReset();
          break;
        case "mode":
          this.turtleReset();
          if (turtleObj.value === "logo") {
            this.turtle.setSize(0);
            this.turtle.left(TURTLE_STANDARD_MODE_BEARING); // for logo mode
            this.turtle.setSize(TURTLE_SIZE_DEFAULT);
            this.mode = "logo";
          }
          break;
      }
    } catch (err) {
      console.log("error processing canvas turtle action:");
      console.log(msg);
      console.log(err);
    }
  }

  runCommand(msg: string) {
    const canvas: HTMLCanvasElement = document.getElementById(
      "canvasDisplay"
    ) as HTMLCanvasElement;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;

    try {
      const drawObj = JSON.parse(msg);
      if (drawObj.clearCanvas) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      }
      switch (drawObj.action) {
        case "fill":
          context.fill(drawObj.fillRule);
          break;
        case "fillRect":
          context.fillRect(drawObj.x, drawObj.y, drawObj.width, drawObj.height);
          break;
        case "strokeRect":
          context.strokeRect(
            drawObj.x,
            drawObj.y,
            drawObj.width,
            drawObj.height
          );
          break;
        case "clearRect":
          context.clearRect(
            drawObj.x,
            drawObj.y,
            drawObj.width,
            drawObj.height
          );
          break;
        case "moveTo":
          context.moveTo(drawObj.x, drawObj.y);
          break;
        case "lineTo":
          context.lineTo(drawObj.x, drawObj.y);
          break;
        case "fillStyle":
          context.fillStyle = drawObj.color;
          break;
        case "strokeStyle":
          context.strokeStyle = drawObj.color;
          break;
        case "lineWidth":
          context.lineWidth = drawObj.value;
          break;
        case "font":
          context.font = drawObj.value;
          break;
        case "textAlign":
          context.textAlign = drawObj.value;
          break;
        case "textBaseline":
          context.textBaseline = drawObj.value;
          break;
        case "beginPath":
          context.beginPath();
          break;
        case "closePath":
          context.closePath();
          break;
        case "stroke":
          context.stroke();
          break;
        case "arc":
          context.arc(
            drawObj.x,
            drawObj.y,
            drawObj.radius,
            drawObj.startAngle,
            drawObj.endAngle,
            drawObj.counterclockwise
          );
          break;
        case "ellipse":
          context.ellipse(
            drawObj.x,
            drawObj.y,
            drawObj.radiusX,
            drawObj.radiusY,
            drawObj.rotation,
            drawObj.startAngle,
            drawObj.endAngle,
            drawObj.counterclockwise
          );
          break;
        case "arcTo":
          context.arcTo(
            drawObj.x1,
            drawObj.y1,
            drawObj.x2,
            drawObj.y2,
            drawObj.radius
          );
          break;
        case "bezierCurveTo":
          context.bezierCurveTo(
            drawObj.cp1x,
            drawObj.cp1y,
            drawObj.cp2x,
            drawObj.cp2y,
            drawObj.x,
            drawObj.y
          );
          break;
        case "fillText":
          if (drawObj.maxWidth === "") {
            context.fillText(drawObj.text, drawObj.x, drawObj.y);
          } else {
            context.fillText(
              drawObj.text,
              drawObj.x,
              drawObj.y,
              drawObj.maxWidth
            );
          }
          break;
        case "strokeText":
          if (drawObj.maxWidth === "") {
            context.strokeText(drawObj.text, drawObj.x, drawObj.y);
          } else {
            context.strokeText(
              drawObj.text,
              drawObj.x,
              drawObj.y,
              drawObj.maxWidth
            );
          }
          break;
        default:
          console.log("unknown canvas draw action:");
          console.log(msg);
      }
    } catch (err) {
      console.log("error processing canvas draw action:");
      console.log(msg);
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
        />
      </div>
    );
  }
}

export default CanvasDisplay;
