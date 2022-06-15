import RealTurtle from "real-turtle";

const TURTLE_CIRCLE_CCW_DEFAULT = true;
const TURTLE_SIZE_DEFAULT = 15;
const TURTLE_WIDTH_DEFAULT = 1;
const TURTLE_SPEED_DEFAULT = 0.5;
const TURTLE_STROKE_DEFAULT = "BLACK";
const TURTLE_STANDARD_MODE_BEARING = 90;

const processTurtleCommand = (turtle: RealTurtle, cmd: any) => {
  try {
    switch (cmd.action) {
      case "forward":
        turtle.forward(cmd.value);
        break;
      case "backward":
        turtle.back(cmd.value);
        break;
      case "right":
        turtle.right(cmd.value);
        turtle.options.mode === "logo"
          ? (turtle.options.state.heading =
              turtle.options.state.heading + cmd.value)
          : (turtle.options.state.heading =
              (turtle.options.state.heading || 0) - cmd.value);
        break;
      case "left":
        turtle.left(cmd.value);
        turtle.options.mode === "logo"
          ? (turtle.options.state.heading =
              (turtle.options.state.heading || 0) - cmd.value)
          : (turtle.options.state.heading =
              turtle.options.state.heading + cmd.value);
        break;
      case "setposition":
        turtle.setPosition(
          turtle.canvas.width / 2 + cmd.x,
          turtle.canvas.height / 2 - cmd.y
        );
        break;
      case "penup":
        turtle.penUp();
        break;
      case "pendown":
        turtle.penDown();
        break;
      case "pensize":
        turtle.setLineWidth(cmd.value);
        break;
      case "setheading":
        const turn = cmd.value - (turtle.options.state.heading || 0);
        if (turn !== 0) {
          if (turtle.options.mode === "logo") {
            turtle.right(turn);
          } else {
            // standard
            turtle.left(turn);
          }
          turtle.options.state.heading = cmd.value;
        }
        break;
      case "hideturtle":
        turtle.setSize(0);
        break;
      case "showturtle":
        turtle.setSize(TURTLE_SIZE_DEFAULT); // default
        break;
      case "pencolor":
        if (typeof cmd.value === "string" || cmd.value instanceof String) {
          turtle.setStrokeStyle(cmd.value); // a named color as string or html code
        } else {
          turtle.setStrokeStyle(
            `rgb(${cmd.value[0]},${cmd.value[1]},${cmd.value[2]})`
          ); // color tuple
        }
        break;
      case "circle":
        turtle.arc(cmd.radius, cmd.extent, TURTLE_CIRCLE_CCW_DEFAULT); // set counterclockwise to true for standard mode
        turtle.options.mode === "logo"
          ? (turtle.options.state.heading =
              (turtle.options.state.heading || 0) - cmd.extent)
          : (turtle.options.state.heading =
              (turtle.options.state.heading || 0) + cmd.extent);
        break;
      case "begin_fill":
        turtle.beginPath();
        break;
      case "end_fill":
        turtle.closePath();
        turtle.fill();
        break;
      case "fillcolor":
        if (typeof cmd.value === "string" || cmd.value instanceof String) {
          turtle.setFillStyle(cmd.value); // a named color as string or html code
        } else {
          turtle.setFillStyle(
            `rgb(${cmd.value[0]},${cmd.value[1]},${cmd.value[2]})`
          ); // color tuple
        }
        break;
      case "speed":
        let speed_val = 0.5;
        switch (cmd.value) {
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
            speed_val = cmd.value === 0 ? 1 : cmd.value / 10;
        }

        turtle.setSpeed(speed_val);
        break;
    }
  } catch (err) {
    console.log("error processing canvas turtle action:");
    console.log(cmd);
    console.log(err);
  }
};

const initialiseTurtle: (
  canvas: HTMLCanvasElement,
  mode: "standard" | "logo"
) => RealTurtle = (canvas, mode) => {
  let turtle = new RealTurtle(canvas, {
    autoStart: true,
    state: {},
  }) as RealTurtle;
  turtle.setPosition(canvas.width / 2, canvas.height / 2);
  if (mode === "standard") {
    turtle.right(TURTLE_STANDARD_MODE_BEARING); // for standard mode
  }
  turtle.options.state.heading = 0;
  turtle.options.mode = mode;
  turtle.setSize(mode === "logo" ? 0 : TURTLE_SIZE_DEFAULT);
  turtle.setLineWidth(TURTLE_WIDTH_DEFAULT);
  turtle.setSpeed(TURTLE_SPEED_DEFAULT);
  turtle.setStrokeStyle(TURTLE_STROKE_DEFAULT);
  return turtle;
};

export { processTurtleCommand, initialiseTurtle };
