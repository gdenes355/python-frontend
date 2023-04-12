const TURTLE_CIRCLE_CCW_DEFAULT = true;
const TURTLE_SIZE_DEFAULT = 15;
const TURTLE_WIDTH_DEFAULT = 1;
const TURTLE_SPEED_DEFAULT = 0.5;
const TURTLE_STROKE_DEFAULT = "BLACK";
const TURTLE_STANDARD_MODE_BEARING = 90;

class SimpleTurtle {
  canvas: HTMLCanvasElement;
  options: TurtleOptions;
  ctx: CanvasRenderingContext2D | null;

  constructor(canvas: HTMLCanvasElement, options: TurtleOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.options = options;
    this.options.state.x = this.canvas.width / 2;
    this.options.state.y = this.canvas.height / 2;
    if (this.ctx !== null) {
      this.ctx.moveTo(this.options.state.x, this.options.state.y);
    }
  }
  async setPosition(x: number, y: number) {}

  forward(distance: number) {
    if (!this.ctx) return;

    const new_x =
      this.options.state.x +
      distance * Math.cos((this.options.state.heading / 180) * Math.PI);
    const new_y =
      this.options.state.y -
      distance * Math.sin((this.options.state.heading / 180) * Math.PI);

    window.requestAnimationFrame(() => this.driveTo(new_x, new_y));
  }

  driveTo(x: number, y: number) {
    if (!this.ctx) return;

    let ch_x = 0;
    let ch_y = 0;

    if (x === this.options.state.x) {
      if (y === this.options.state.y) {
        return;
      }
      ch_y = y > this.options.state.y ? 1 : -1;
    } else {
      ch_x = x > this.options.state.x ? 1 : -1;
      ch_y = (y - this.options.state.y) / (x - this.options.state.x);
    }

    this.ctx.beginPath();
    this.ctx.moveTo(this.options.state.x, this.options.state.y);
    this.ctx.lineTo(this.options.state.x + ch_x, this.options.state.y + ch_y);
    this.ctx.stroke();
    this.options.state.x += ch_x;
    this.options.state.y += ch_y;

    window.requestAnimationFrame(() =>
      setTimeout(() => this.driveTo(x, y), 30 * this.options.state.speed)
    );
  }

  async back(distance: number) {}
  async right(angle: number) {
    this.options.state.heading = (this.options.state.heading + angle) % 360;
  }
  async left(angle: number) {
    this.options.state.heading = (this.options.state.heading + angle) % 360;
  }
  async penUp() {}
  async penDown() {}
  async setLineWidth(width: number) {}
  async setStrokeStyle(style: string) {}
  async setSize(size: number) {}
  async arc(radius: number, extent: number, counterclockwise: boolean) {}
  async beginPath() {}
  async closePath() {}
  async fill() {}
  async setFillStyle(style: string) {}
  async setSpeed(speed: number) {}
}

type TurtleOptions = {
  autoStart?: boolean;
  image?: string;
  state: TurtleOptionsState; // added for Python frontend
  mode?: "standard" | "logo";
};

type TurtleOptionsState = {
  strokeStyle?: string;
  fillStyle?: string;
  lineCap?: string;
  lineJoin?: string;
  font?: string;
  lineWidth?: number;
  size?: number;
  speed: number;
  heading: number; // added for Python frontend
  hasMoved?: boolean; // added for Python frontend
  x: number; // added for Python frontend
  y: number; // added for Python frontend
};

var turtles = new Map<number, SimpleTurtle>();
var turtleMode: "standard" | "logo" = "standard";

const processTurtleCommand = async (
  id: number,
  cmd: any,
  canvas: HTMLCanvasElement
) => {
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
        turtle.forward(cmd.value);
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
) => Promise<SimpleTurtle> = async (canvas) => {
  let turtle = new SimpleTurtle(canvas, {
    state: { size: 0, x: 0, y: 0, heading: 0, speed: 0.5 },
    autoStart: false,
  }) as SimpleTurtle;
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
