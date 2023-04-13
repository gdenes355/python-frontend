const TURTLE_CIRCLE_CCW_DEFAULT = true;
const TURTLE_SIZE_DEFAULT = 15;
const TURTLE_WIDTH_DEFAULT = 1;
const TURTLE_SPEED_DEFAULT = 0.5;
const TURTLE_STROKE_DEFAULT = "BLACK";
const TURTLE_LOGO_START_HEADING = 90;

class SimpleTurtle {
  canvas: HTMLCanvasElement;
  options: TurtleOptions;
  ctx: CanvasRenderingContext2D | null;
  completeCallback: () => void;
  alive: boolean = true;

  constructor(
    canvas: HTMLCanvasElement,
    options: TurtleOptions,
    onComplete: () => void
  ) {
    this.canvas = canvas;
    this.completeCallback = onComplete;
    this.ctx = canvas.getContext("2d");
    this.options = options;
    this.options.state.x = this.canvas.width / 2;
    this.options.state.y = this.canvas.height / 2;
    if (this.ctx !== null) {
      this.ctx.moveTo(this.options.state.x, this.options.state.y);
    }
  }

  setPosition(x: number, y: number) {}

  stopTurtle() {
    this.alive = false;
  }

  forward(distance: number) {
    if (!this.ctx) {
      this.completeCallback();
      return;
    }

    const new_x =
      this.options.state.x +
      distance * Math.cos((this.options.state.heading / 180) * Math.PI);
    const new_y =
      this.options.state.y -
      distance * Math.sin((this.options.state.heading / 180) * Math.PI);

    window.requestAnimationFrame(() => this.driveTo(new_x, new_y));
  }

  driveTo(x: number, y: number) {
    if (!this.ctx) {
      this.completeCallback();
      return;
    }

    let ch_x = 0;
    let ch_y = 0;

    if (Math.abs(x - this.options.state.x) < 1) {
      if (Math.abs(y - this.options.state.y) < 1) {
        this.options.state.x = x;
        this.options.state.y = y;
        this.completeCallback();
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

    window.requestAnimationFrame(() => {
      if (this.alive) {
        setTimeout(() => this.driveTo(x, y), 30 * this.options.state.speed);
      }
    });
  }

  back(distance: number) {}

  right(angle: number) {
    if (this.options.mode === "logo") {
      angle = -1 * angle;
    }
    this.options.state.heading = (this.options.state.heading - angle) % 360;
    this.completeCallback();
  }

  left(angle: number) {
    if (this.options.mode === "logo") {
      angle = -1 * angle;
    }
    this.options.state.heading = (this.options.state.heading + angle) % 360;
    this.completeCallback();
  }

  penUp() {}
  penDown() {}
  setLineWidth(width: number) {}
  setStrokeStyle(style: string) {}
  setSize(size: number) {}
  arc(radius: number, extent: number, counterclockwise: boolean) {}
  beginPath() {}
  closePath() {}
  fill() {}
  setFillStyle(style: string) {}
  setSpeed(speed: number) {}
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

const commandCompleted = () => {
  let x = new XMLHttpRequest();
  x.open("post", "/@turtle@/resp.js");
  x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  x.setRequestHeader("cache-control", "no-cache, no-store, max-age=0");
  try {
    x.send(
      JSON.stringify({
        completed: true,
      })
    );
  } catch (e) {
    console.log(e);
  }
};

const processTurtleCommand = (
  id: number,
  cmd: any,
  canvas: HTMLCanvasElement
) => {
  if (cmd.action === "stop") {
    turtles.forEach((t) => t.stopTurtle());
    commandCompleted();
    return undefined;
  }

  if (cmd.action === "mode") {
    // reset the canvas!
    turtleMode = cmd.value;
    turtles.clear();
    commandCompleted();
    return undefined;
  }
  let turtle = turtles.get(id);
  if (!turtle && cmd.action === "reset") {
    commandCompleted();
    // ignore turtle reset if turtle doesn't exist
    return undefined;
  }
  if (!turtle) {
    turtle = initialiseTurtle(canvas);
    turtles.set(id, turtle);
  }

  if (!turtle.options.state.hasMoved) {
    turtle.options.state.hasMoved = true;
    turtle.setSize(turtleMode === "logo" ? 0 : TURTLE_SIZE_DEFAULT);
  }
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
        break;
      case "left":
        turtle.left(cmd.value);
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
          if (turtleMode === "logo") {
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
        turtleMode === "logo"
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
      case "reset":
        turtle.setSize(0);
        turtles.delete(id);
        commandCompleted();
    }
  } catch (err) {
    console.log("error processing canvas turtle action:");
    console.log(cmd);
    console.log(err);
  }

  return undefined;
};

const initialiseTurtle: (canvas: HTMLCanvasElement) => SimpleTurtle = (
  canvas
) => {
  let turtle = new SimpleTurtle(
    canvas,
    {
      state: { size: 0, x: 0, y: 0, heading: 0, speed: 0.5 },
      autoStart: false,
    },
    commandCompleted
  ) as SimpleTurtle;
  turtle.options.mode = turtleMode;
  turtle.options.state.heading =
    turtleMode === "logo" ? TURTLE_LOGO_START_HEADING : 0;
  turtle.options.state.hasMoved = false;
  turtle.setSize(0);
  turtle.setLineWidth(TURTLE_WIDTH_DEFAULT);
  turtle.setSpeed(TURTLE_SPEED_DEFAULT);
  turtle.setStrokeStyle(TURTLE_STROKE_DEFAULT);
  return turtle;
};

const clearTurtle = (canvas: HTMLCanvasElement) => {
  turtles.clear();
  canvas.getContext("2d")?.clearRect(0, 0, 1000, 1000);
};

export { processTurtleCommand, clearTurtle };
