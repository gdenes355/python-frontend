import RealTurtle from "real-turtle";

const TURTLE_CIRCLE_CCW_DEFAULT = true;
const TURTLE_SIZE_DEFAULT = 15;
const TURTLE_WIDTH_DEFAULT = 1;
const TURTLE_SPEED_DEFAULT = 0.5;
const TURTLE_STROKE_DEFAULT = "BLACK";
const TURTLE_STANDARD_MODE_BEARING = 90;

var turtles = new Map<number, RealTurtle>();
var turtleMode: "standard" | "logo" = "standard";

const processTurtleCommand = async (
  id: number,
  cmd: any,
  canvas: HTMLCanvasElement
) => {
  id = 0; // turns out that real-turtle doesn't like multiple turtles
  if (cmd.action === "mode") {
    // reset the canvas!
    turtleMode = cmd.value;
    turtles.clear();
    return undefined;
  }
  let turtle = turtles.get(id);
  if (!turtle && cmd.action === "reset") {
    // ignore turtle reset if turtle doesn't exist
    return undefined;
  }
  if (!turtle) {
    turtle = await initialiseTurtle(canvas);
    turtles.set(id, turtle);
  }

  if (!turtle.options.state.hasMoved) {
    turtle.options.state.hasMoved = true;
    await turtle.setSize(turtleMode === "logo" ? 0 : TURTLE_SIZE_DEFAULT);
  }
  try {
    switch (cmd.action) {
      case "forward":
        await turtle.forward(cmd.value);
        break;
      case "backward":
        await turtle.back(cmd.value);
        break;
      case "right":
        await turtle.right(cmd.value);
        turtleMode === "logo"
          ? (turtle.options.state.heading =
              turtle.options.state.heading + cmd.value)
          : (turtle.options.state.heading =
              (turtle.options.state.heading || 0) - cmd.value);
        break;
      case "left":
        await turtle.left(cmd.value);
        turtleMode === "logo"
          ? (turtle.options.state.heading =
              (turtle.options.state.heading || 0) - cmd.value)
          : (turtle.options.state.heading =
              turtle.options.state.heading + cmd.value);
        break;
      case "setposition":
        await turtle.setPosition(
          turtle.canvas.width / 2 + cmd.x,
          turtle.canvas.height / 2 - cmd.y
        );
        break;
      case "penup":
        await turtle.penUp();
        break;
      case "pendown":
        await turtle.penDown();
        break;
      case "pensize":
        await turtle.setLineWidth(cmd.value);
        break;
      case "setheading":
        const turn = cmd.value - (turtle.options.state.heading || 0);
        if (turn !== 0) {
          if (turtleMode === "logo") {
            await turtle.right(turn);
          } else {
            // standard
            await turtle.left(turn);
          }
          turtle.options.state.heading = cmd.value;
        }
        break;
      case "hideturtle":
        await turtle.setSize(0);
        break;
      case "showturtle":
        await turtle.setSize(TURTLE_SIZE_DEFAULT); // default
        break;
      case "pencolor":
        if (typeof cmd.value === "string" || cmd.value instanceof String) {
          await turtle.setStrokeStyle(cmd.value); // a named color as string or html code
        } else {
          await turtle.setStrokeStyle(
            `rgb(${cmd.value[0]},${cmd.value[1]},${cmd.value[2]})`
          ); // color tuple
        }
        break;
      case "circle":
        await turtle.arc(cmd.radius, cmd.extent, TURTLE_CIRCLE_CCW_DEFAULT); // set counterclockwise to true for standard mode
        turtleMode === "logo"
          ? (turtle.options.state.heading =
              (turtle.options.state.heading || 0) - cmd.extent)
          : (turtle.options.state.heading =
              (turtle.options.state.heading || 0) + cmd.extent);
        break;
      case "begin_fill":
        await turtle.beginPath();
        break;
      case "end_fill":
        await turtle.closePath();
        await turtle.fill();
        break;
      case "fillcolor":
        if (typeof cmd.value === "string" || cmd.value instanceof String) {
          await turtle.setFillStyle(cmd.value); // a named color as string or html code
        } else {
          await turtle.setFillStyle(
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

        await turtle.setSpeed(speed_val);
        break;
    }
  } catch (err) {
    console.log("error processing canvas turtle action:");
    console.log(cmd);
    console.log(err);
  }
  return undefined;
};

const initialiseTurtle: (
  canvas: HTMLCanvasElement
) => Promise<RealTurtle> = async (canvas) => {
  let turtle = new RealTurtle(canvas, {
    state: { size: 0 },
    async: true,
    autoStart: false,
  }) as RealTurtle;
  await turtle.setPosition(canvas.width / 2, canvas.height / 2);
  if (turtleMode === "standard") {
    await turtle.right(TURTLE_STANDARD_MODE_BEARING); // for standard mode
  }
  turtle.options.state.heading = 0;
  turtle.options.state.hasMoved = false;
  await turtle.setSize(0);
  await turtle.setLineWidth(TURTLE_WIDTH_DEFAULT);
  await turtle.setSpeed(TURTLE_SPEED_DEFAULT);
  await turtle.setStrokeStyle(TURTLE_STROKE_DEFAULT);
  return turtle;
};

const clearTurtle = (canvas: HTMLCanvasElement) => {
  turtles.clear();
  canvas.getContext("2d")?.clearRect(0, 0, 1000, 1000);
};

export { processTurtleCommand, clearTurtle };
