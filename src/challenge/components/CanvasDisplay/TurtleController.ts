const TURTLE_SPEED_DEFAULT = 0.5;
const TURTLE_LOGO_START_HEADING = 90;
const TURTLE_IMG_PATH = "/static/img/turtle.png";
const TURTLE_IMG_WIDTH = 16;
const TURTLE_IMG_HEIGHT = 16;
const TURTLE_UNIT_MOVE_STEP = 6;
const TURTLE_TIME_PAUSE = 40;

class SimpleTurtle {
  imgTurtle: HTMLImageElement;
  canvas: HTMLCanvasElement;
  state: TurtleState;
  ctx: CanvasRenderingContext2D | null;
  canvasBackground: HTMLCanvasElement;
  ctxBackground: CanvasRenderingContext2D | null;
  completeCallback: () => void;
  alive: boolean = true;
  fillPath: Path2D | null;

  constructor(
    canvas: HTMLCanvasElement,
    state: TurtleState,
    onComplete: () => void
  ) {
    this.imgTurtle = new Image();
    this.imgTurtle.src = TURTLE_IMG_PATH;
    this.canvas = canvas;
    this.completeCallback = onComplete;
    this.ctx = canvas.getContext("2d");
    this.canvasBackground = document.createElement("canvas");
    this.canvasBackground.width = canvas.width;
    this.canvasBackground.height = canvas.height;
    this.ctxBackground = this.canvasBackground.getContext("2d");
    this.fillPath = null;
    this.state = state;
    this.state.x = this.canvas.width / 2;
    this.state.y = this.canvas.height / 2;
    if (this.ctxBackground !== null) {
      this.ctxBackground.moveTo(this.state.x, this.state.y);
    }
  }

  setposition(x: number, y: number) {
    // drives to required location but doesn't change the current heading (python compliant)
    window.requestAnimationFrame(() => this.#driveto(x, y, this.state.heading));
  }

  stop() {
    this.alive = false;
  }

  forward(distance: number) {
    const new_x =
      this.state.x + distance * Math.cos((this.state.heading / 180) * Math.PI);
    const new_y =
      this.state.y - distance * Math.sin((this.state.heading / 180) * Math.PI);

    window.requestAnimationFrame(() =>
      this.#driveto(new_x, new_y, this.state.heading)
    );
  }

  // private method
  #drawLineTo(x: number, y: number) {
    if (!this.ctx || !this.ctxBackground) {
      this.completeCallback();
      return;
    }

    this.ctxBackground.beginPath();
    this.ctxBackground.moveTo(this.state.x, this.state.y);
    if (this.state.penDown) {
      this.ctxBackground.lineTo(x, y);
      this.ctxBackground.stroke();
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(
      this.canvasBackground,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    // update state before drawing turtle
    this.state.x = x;
    this.state.y = y;

    if (this.state.showTurtle) {
      // Set the origin to the current location, rotate the context, move the origin back
      this.ctx.translate(this.state.x, this.state.y);
      this.ctx.rotate(-1 * (Math.PI / 180) * this.state.heading);
      this.ctx.translate(-this.state.x, -this.state.y);

      // draw turtle rotated
      this.ctx.drawImage(
        this.imgTurtle,
        this.state.x - TURTLE_IMG_WIDTH,
        this.state.y - TURTLE_IMG_HEIGHT / 2,
        TURTLE_IMG_WIDTH,
        TURTLE_IMG_HEIGHT
      );

      // reset the rotation
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    if (this.fillPath !== null) {
      this.fillPath.lineTo(x, y);
    }
  }

  #driveAlong(arrLocs: Array<[number, number, number]>, completeOnEnd = true) {
    if (arrLocs.length === 0) {
      if (completeOnEnd) {
        this.completeCallback();
      }
      return;
    }

    const [x, y, h] = arrLocs.shift()!;
    this.state.heading = h;
    this.#drawLineTo(x, y);

    if (this.alive) {
      if (this.state.speed === -1) {
        this.#driveAlong(arrLocs, completeOnEnd);
      } else {
        window.requestAnimationFrame(() => {
          setTimeout(
            () => this.#driveAlong(arrLocs, completeOnEnd),
            TURTLE_TIME_PAUSE * this.state.speed
          );
        });
      }
    } else {
      if (completeOnEnd) {
        this.completeCallback();
      }
    }
  }

  #driveto(
    x: number,
    y: number,
    heading: number,
    completeOnEnd: boolean = true
  ) {
    // hmmm should perhaps pay attention to left/right rather than most efficient turn??
    if (Math.abs(heading - this.state.heading) > 180) {
      if (heading > this.state.heading) {
        heading -= 360;
      } else {
        heading += 360;
      }
    }

    let repeatAngle = true;
    let repeatLoc = true;

    let ch_x = 0;
    let ch_y = 0;
    let ch_h = 0;

    // set heading first if needed
    if (Math.abs(this.state.heading - heading) < 3) {
      this.state.heading = heading;
      repeatAngle = false;
    } else {
      ch_h = heading > this.state.heading ? 3 : -3;
    }

    // find vector between start/end
    const ch_x_reqd = x - this.state.x;
    const ch_y_reqd = y - this.state.y;

    const tot_dist = Math.sqrt(ch_x_reqd * ch_x_reqd + ch_y_reqd * ch_y_reqd);

    if (tot_dist < TURTLE_UNIT_MOVE_STEP) {
      // if we're close enough, just go there
      ch_x = ch_x_reqd;
      ch_y = ch_y_reqd;
      repeatLoc = false;
    } else {
      ch_x = (ch_x_reqd / tot_dist) * TURTLE_UNIT_MOVE_STEP;
      ch_y = (ch_y_reqd / tot_dist) * TURTLE_UNIT_MOVE_STEP;
    }

    // draw line
    this.state.heading += ch_h;
    this.#drawLineTo(this.state.x + ch_x, this.state.y + ch_y);

    if (this.alive && (repeatAngle || repeatLoc)) {
      if (this.state.speed === -1) {
        this.#driveto(x, y, heading, completeOnEnd);
      } else {
        window.requestAnimationFrame(() => {
          setTimeout(
            () => this.#driveto(x, y, heading, completeOnEnd),
            TURTLE_TIME_PAUSE * this.state.speed
          );
        });
      }
    } else if (completeOnEnd) {
      this.completeCallback();
    }
  }

  back(distance: number) {
    this.forward(-1 * distance);
  }

  left(angle: number) {
    const new_heading = (this.state.heading + angle) % 360;
    window.requestAnimationFrame(() =>
      this.#driveto(this.state.x, this.state.y, new_heading)
    );
  }

  right(angle: number) {
    this.left(-1 * angle);
  }

  setheading(angle: number) {
    if (this.state.mode === "logo") {
      angle = 90 - angle;
    }
    window.requestAnimationFrame(() =>
      this.#driveto(this.state.x, this.state.y, angle)
    );
  }

  penup() {
    this.state.penDown = false;
    this.completeCallback();
  }

  pendown() {
    this.state.penDown = true;
    this.completeCallback();
  }

  pensize(width: number) {
    if (this.ctxBackground) {
      this.ctxBackground.lineWidth = width;
    }
    this.completeCallback();
  }

  showTurtle() {
    this.state.showTurtle = true;
    this.#driveto(this.state.x, this.state.y, this.state.heading);
  }

  hideTurtle() {
    this.state.showTurtle = false;
    this.#driveto(this.state.x, this.state.y, this.state.heading);
  }

  speed(speed: number) {
    this.state.speed = speed;
    this.completeCallback();
  }

  pencolor(color: string) {
    if (this.ctxBackground) {
      this.ctxBackground.strokeStyle = color;
    }
    this.completeCallback();
  }

  fillcolor(color: string) {
    if (this.ctxBackground) {
      this.ctxBackground.fillStyle = color;
    }
    this.completeCallback();
  }

  begin_fill() {
    this.fillPath = new Path2D();
    this.fillPath.moveTo(this.state.x, this.state.y);
    this.completeCallback();
  }

  end_fill() {
    if (this.ctxBackground && this.fillPath !== null) {
      this.ctxBackground.fill(this.fillPath);
      this.fillPath = null;
      this.#driveto(this.state.x, this.state.y, this.state.heading);
    }
    this.completeCallback();
  }

  circle(radius: number, extent: number = 360) {
    // counter clockwise in both modes (python compliant)
    // draw circle with given radius
    // the centre is radius in a dist perpendicular left to the current heading
    const radHeading = this.state.heading + 90;
    const centreX =
      this.state.x + radius * Math.cos((radHeading * Math.PI) / 180);
    const centreY =
      this.state.y - radius * Math.sin((radHeading * Math.PI) / 180);

    const circDist = 2 * Math.PI * radius;
    const steps = Math.floor(circDist / TURTLE_UNIT_MOVE_STEP);
    const arrLocs = new Array(steps);

    for (let i = 0; i < steps; i++) {
      const angle = extent * ((i + 1) / steps);
      const x =
        centreX +
        radius * Math.cos(((180 - angle - radHeading) * Math.PI) / 180);
      const y =
        centreY +
        radius * Math.sin(((180 - angle - radHeading) * Math.PI) / 180);
      arrLocs[i] = [x, y, this.state.heading + angle];
    }

    this.#driveAlong(arrLocs);
  }
}

type TurtleState = {
  showTurtle: any;
  penDown: boolean;
  speed: number;
  heading: number;
  x: number;
  y: number;
  mode?: "standard" | "logo";
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
    turtles.forEach((t) => t.stop());
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
  if (cmd.action === "reset") {
    // ignore turtle reset if turtle doesn't exist
    if (turtle) {
      turtle.hideTurtle();
      turtles.delete(id);
    }
    if (cmd.value === "sync") {
      commandCompleted();
    }
    return undefined;
  }

  if (!turtle) {
    turtle = initialiseTurtle(canvas);
    turtles.set(id, turtle);
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
        turtle.setposition(
          turtle.canvas.width / 2 + cmd.x,
          turtle.canvas.height / 2 - cmd.y
        );
        break;
      case "penup":
        turtle.penup();
        break;
      case "pendown":
        turtle.pendown();
        break;
      case "pensize":
        turtle.pensize(cmd.value);
        break;
      case "setheading":
        const turn = cmd.value - (turtle.state.heading || 0);
        if (turn !== 0) {
          if (turtleMode === "logo") {
            turtle.right(turn);
          } else {
            // standard
            turtle.left(turn);
          }
          turtle.state.heading = cmd.value;
        }
        break;
      case "hideturtle":
        turtle.hideTurtle();
        break;
      case "showturtle":
        turtle.showTurtle();
        break;
      case "pencolor":
        if (typeof cmd.value === "string" || cmd.value instanceof String) {
          turtle.pencolor(cmd.value); // a named color as string or html code
        } else {
          turtle.pencolor(
            `rgb(${cmd.value[0]},${cmd.value[1]},${cmd.value[2]})`
          ); // color tuple
        }
        break;
      case "circle":
        turtle.circle(cmd.radius, cmd.extent);
        turtleMode === "logo"
          ? (turtle.state.heading = (turtle.state.heading || 0) - cmd.extent)
          : (turtle.state.heading = (turtle.state.heading || 0) + cmd.extent);
        break;
      case "begin_fill":
        turtle.begin_fill();
        break;
      case "end_fill":
        turtle.end_fill();
        break;
      case "fillcolor":
        if (typeof cmd.value === "string" || cmd.value instanceof String) {
          turtle.fillcolor(cmd.value); // a named color as string or html code
        } else {
          turtle.fillcolor(
            `rgb(${cmd.value[0]},${cmd.value[1]},${cmd.value[2]})`
          ); // color tuple
        }
        break;
      case "speed":
        let speed_val = 0.5;
        switch (cmd.value) {
          case "fastest":
            speed_val = -1;
            break;
          case "fast":
            speed_val = 0.25;
            break;
          case "normal":
            speed_val = 0.5;
            break;
          case "slow":
            speed_val = 0.75;
            break;
          case "slowest":
            speed_val = 1;
            break;
          default:
            speed_val = cmd.value === 0 ? -1 : 1 - cmd.value / 10;
        }

        turtle.speed(speed_val);
        break;
    }
  } catch (err) {
    // SHOULD FIND A WAY TO PASS ERROR BACK TO PYTHON THEN RAISE PYTHON EXCEPTION
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
      x: 0,
      y: 0,
      heading: turtleMode === "logo" ? TURTLE_LOGO_START_HEADING : 0,
      speed: TURTLE_SPEED_DEFAULT,
      showTurtle: true,
      penDown: true,
      mode: turtleMode,
    },
    commandCompleted
  ) as SimpleTurtle;
  return turtle;
};

const clearTurtle = (canvas: HTMLCanvasElement) => {
  turtles.clear();
  canvas.getContext("2d")?.clearRect(0, 0, 1000, 1000);
};

export { processTurtleCommand, clearTurtle };
