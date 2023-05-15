const TURTLE_SPEED_DEFAULT = 0.5;
const TURTLE_LOGO_START_HEADING = 90;
const TURTLE_IMG_SRC =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kTtIw0Acxr8+pCIVByuKOGSoThbEFx2likWwUNoKrTqYXPqCJg1Jiouj4Fpw8LFYdXBx1tXBVRAEHyCuLk6KLlLi/5JCixgPjvvx3X0fd98B3kaFKYZ/AlBUU0/FY0I2tyoEXuHHIAYwg6jIDC2RXszAdXzdw8PXuwjPcj/35+iV8wYDPALxHNN0k3iDeHbT1DjvE4dYSZSJz4nHdbog8SPXJYffOBdt9vLMkJ5JzROHiIViB0sdzEq6QjxNHJYVlfK9WYdlzluclUqNte7JXxjMqytprtMcQRxLSCAJARJqKKMCExFaVVIMpGg/5uIftv1JcknkKoORYwFVKBBtP/gf/O7WKExNOknBGND1Ylkfo0BgF2jWLev72LKaJ4DvGbhS2/5qA4h+kl5va+EjoG8buLhua9IecLkDDD1poi7ako+mt1AA3s/om3JA/y3Qs+b01trH6QOQoa6Wb4CDQ2CsSNnrLu/u7uzt3zOt/n4AGeVy6hhVemgAAAAGYktHRAAAAAAAAPlDu38AAAAJcEhZcwAAMsAAADLAAShkWtsAAAAHdElNRQfnBBcWNDh0WNzXAAAAxElEQVRIx8WXyQ6DMAxEM5H//5fdS1ELihfMOFjihJQ3XmKGMX6h32dL4A9qvWsDa1LcdnCLgHk9UNXUQZ2BuSSoRgJow3U68AoFQC9/CtwhAFYJnVJTBMDqnwdmCIA3OA/hrgB4U5sBVwXQwHcFILqnFXim/4iWRBUcCMAcL4W0rUS/10vw2DFcQvu+3rxO8rTM1QUi1TJXgSuwdmaYyniVLQuYHi420LS3R7ZdwIyvbnWaWXtL99ayGxiBW39f2sx6Jj7b5UlE5o7znAAAAABJRU5ErkJggg==";
const TURTLE_IMG_WIDTH = 16;
const TURTLE_IMG_HEIGHT = 16;
const TURTLE_UNIT_MOVE_STEP = 6;
const TURTLE_TIME_PAUSE = 40;
const TURTLE_ANGLE_ADJUSTMENT = 6;

class SimpleTurtle {
  originalTurleImageData = new Uint8ClampedArray([]);
  originalTurleImageSize = [0, 0];

  turtleImage: HTMLImageElement | undefined = undefined;
  canvas: HTMLCanvasElement;
  state: TurtleState;
  ctx: CanvasRenderingContext2D | null;
  canvasBackground: HTMLCanvasElement;
  ctxBackground: CanvasRenderingContext2D | null;
  alive: boolean = true;
  fillPath: Path2D | null;

  constructor(canvas: HTMLCanvasElement, state: TurtleState) {
    let baseImage = new Image();
    baseImage.onload = () => {
      let canvas = document.createElement("canvas");
      let context = canvas.getContext("2d")!;
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      context.drawImage(baseImage, 0, 0);
      const data = context.getImageData(
        0,
        0,
        baseImage.width,
        baseImage.height
      ).data;
      this.originalTurleImageData = new Uint8ClampedArray(data.length);
      for (let i = 0; i < data.length; i += 1) {
        this.originalTurleImageData[i] = data[i];
      }
      this.originalTurleImageSize = [baseImage.width, baseImage.height];

      this.updateTurtleImage();
    };
    baseImage.src = TURTLE_IMG_SRC;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.canvasBackground = document.createElement("canvas");
    this.canvasBackground.width = canvas.width;
    this.canvasBackground.height = canvas.height;
    this.ctxBackground = this.canvasBackground.getContext("2d");
    this.fillPath = null;
    this.state = state;
    this.state.x = this.canvas.width / 2;
    this.state.y = this.canvas.height / 2;
    if (this.ctxBackground) {
      this.ctxBackground.moveTo(this.state.x, this.state.y);
    }
  }

  setposition(x: number, y: number) {
    // drives to required location but doesn't change the current heading (python compliant)
    return new Promise<void>((r, e) => {
      if (this.state.speed === -1 || this.state.virtual) {
        this.driveto(x, y, this.state.heading).catch(e).then(r);
      } else {
        window.requestAnimationFrame(() =>
          this.driveto(x, y, this.state.heading).catch(e).then(r)
        );
      }
    });
  }

  stop() {
    this.alive = false;
    return Promise.resolve();
  }

  forward(distance: number) {
    const new_x =
      this.state.x + distance * Math.cos((this.state.heading / 180) * Math.PI);
    const new_y =
      this.state.y - distance * Math.sin((this.state.heading / 180) * Math.PI);

    return new Promise<void>((r, e) => {
      if (this.state.speed === -1 || this.state.virtual) {
        this.driveto(new_x, new_y, this.state.heading).catch(e).then(r);
      } else {
        window.requestAnimationFrame(() =>
          this.driveto(new_x, new_y, this.state.heading).catch(e).then(r)
        );
      }
    });
  }

  private updateTurtleImage() {
    if (!this.originalTurleImageData.length) return;

    if (!this.turtleImage) {
      this.turtleImage = new Image();
    }
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d")!;
    canvas.width = this.originalTurleImageSize[0];
    canvas.height = this.originalTurleImageSize[1];
    context.fillStyle = this.state.pencolor;
    context.fillRect(0, 0, 1, 1);
    context.fillStyle = this.state.fillcolor;
    context.fillRect(1, 0, 1, 1);
    const imgData = context.getImageData(
      0,
      0,
      this.originalTurleImageSize[0],
      this.originalTurleImageSize[1]
    );
    for (let i = 0; i < imgData.data.length; i += 4) {
      if (this.originalTurleImageData[i + 3] === 0) {
        // background, A=0
        imgData.data[i + 3] = 0;
      } else if (this.originalTurleImageData[i + 0] === 0) {
        // border
        imgData.data[i + 0] = imgData.data[0];
        imgData.data[i + 1] = imgData.data[1];
        imgData.data[i + 2] = imgData.data[2];
        imgData.data[i + 3] = 255;
      } else {
        imgData.data[i + 0] = imgData.data[4];
        imgData.data[i + 1] = imgData.data[5];
        imgData.data[i + 2] = imgData.data[6];
        imgData.data[i + 3] = 255;
      }
    }
    context.putImageData(imgData, 0, 0);

    this.turtleImage.src = canvas.toDataURL();
  }

  private drawLineTo(x: number, y: number) {
    if (!this.ctx || !this.ctxBackground) {
      return Promise.resolve();
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

    if (this.state.showTurtle && this.turtleImage) {
      // Set the origin to the current location, rotate the context, move the origin back
      this.ctx.translate(this.state.x, this.state.y);
      this.ctx.rotate(-1 * (Math.PI / 180) * this.state.heading);
      this.ctx.translate(-this.state.x, -this.state.y);

      //this.ctx.globalCompositeOperation = "destination-out";
      // draw turtle rotated
      this.ctx.drawImage(
        this.turtleImage,
        this.state.x - TURTLE_IMG_WIDTH,
        this.state.y - TURTLE_IMG_HEIGHT / 2,
        TURTLE_IMG_WIDTH,
        TURTLE_IMG_HEIGHT
      );
      //this.ctx.globalCompositeOperation = "source-over";

      // reset the rotation
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    if (this.fillPath !== null) {
      this.fillPath.lineTo(x, y);
    }
    return Promise.resolve();
  }

  private driveAlong(arrLocs: Array<[number, number, number]>): Promise<void> {
    if (arrLocs.length === 0) {
      return Promise.resolve();
    }

    const [x, y, h] = arrLocs.shift()!;
    this.state.heading = h;
    this.drawLineTo(x, y);

    if (this.alive) {
      if (this.state.speed === -1 || this.state.virtual) {
        return this.driveAlong(arrLocs);
      } else {
        return new Promise<void>((r, e) => {
          window.requestAnimationFrame(() => {
            setTimeout(
              () => this.driveAlong(arrLocs).catch(e).then(r),
              TURTLE_TIME_PAUSE * this.state.speed
            );
          });
        });
      }
    } else {
      return Promise.reject(new Error("!alive during driveAlong"));
    }
  }

  private driveto(x: number, y: number, heading: number): Promise<void> {
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
      ch_h =
        heading > this.state.heading
          ? TURTLE_ANGLE_ADJUSTMENT
          : -TURTLE_ANGLE_ADJUSTMENT;
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
    this.drawLineTo(this.state.x + ch_x, this.state.y + ch_y);

    if (!this.alive) {
      return Promise.reject(new Error("!alive during driveto"));
    }

    if (repeatAngle || repeatLoc) {
      if (this.state.speed === -1 || this.state.virtual) {
        return this.driveto(x, y, heading);
      } else {
        return new Promise<void>((r, e) => {
          window.requestAnimationFrame(() => {
            setTimeout(
              () => this.driveto(x, y, heading).catch(e).then(r),
              TURTLE_TIME_PAUSE * this.state.speed
            );
          });
        });
      }
    }
    return Promise.resolve();
  }

  back(distance: number) {
    return this.forward(-1 * distance);
  }

  left(angle: number) {
    const new_heading = (this.state.heading + angle) % 360;

    return new Promise<void>((r, e) => {
      if (this.state.speed === -1 || this.state.virtual) {
        this.state.heading = new_heading;
        this.driveto(this.state.x, this.state.y, new_heading).catch(e).then(r);
      } else {
        window.requestAnimationFrame(() =>
          this.driveto(this.state.x, this.state.y, new_heading).catch(e).then(r)
        );
      }
    });
  }

  right(angle: number) {
    return this.left(-1 * angle);
  }

  setheading(angle: number) {
    if (this.state.mode === "logo") {
      angle = 90 - angle;
    }
    return new Promise<void>((r, e) => {
      if (this.state.speed === -1 || this.state.virtual) {
        this.state.heading = angle;
        this.driveto(this.state.x, this.state.y, angle).catch(e).then(r);
      } else {
        window.requestAnimationFrame(() =>
          this.driveto(this.state.x, this.state.y, angle).catch(e).then(r)
        );
      }
    });
  }

  penup() {
    this.state.penDown = false;
    return Promise.resolve();
  }

  pendown() {
    this.state.penDown = true;
    return Promise.resolve();
  }

  pensize(width: number) {
    if (this.ctxBackground) {
      this.ctxBackground.lineWidth = width;
    }
    return Promise.resolve();
  }

  showTurtle() {
    this.state.showTurtle = true;
    return this.driveto(this.state.x, this.state.y, this.state.heading);
  }

  hideTurtle() {
    this.state.showTurtle = false;
    return this.driveto(this.state.x, this.state.y, this.state.heading);
  }

  speed(speed: number) {
    this.state.speed = speed;
    return Promise.resolve();
  }

  pencolor(color: string) {
    this.state.pencolor = color;
    if (this.ctxBackground) {
      this.ctxBackground.strokeStyle = color;
    }
    this.updateTurtleImage();
    return Promise.resolve();
  }

  pencolor3(r: number, g: number, b: number) {
    return this.pencolor(`rgb(${r},${g},${b})`);
  }

  fillcolor(color: string) {
    this.state.fillcolor = color;
    if (this.ctxBackground) {
      this.ctxBackground.fillStyle = color;
    }
    this.updateTurtleImage();
    return Promise.resolve();
  }

  begin_fill() {
    this.fillPath = new Path2D();
    this.fillPath.moveTo(this.state.x, this.state.y);
    return Promise.resolve();
  }

  end_fill() {
    return new Promise<void>((r, e) => {
      if (this.ctxBackground && this.fillPath !== null) {
        this.ctxBackground.fill(this.fillPath);
        this.fillPath = null;
        this.driveto(this.state.x, this.state.y, this.state.heading)
          .catch(e)
          .then(r);
      } else {
        r();
      }
    });
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

    return this.driveAlong(arrLocs);
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
  pencolor: string;
  fillcolor: string;
  virtual: boolean;
};

var turtles = new Map<number, SimpleTurtle>();
var turtleMode: "standard" | "logo" = "standard";
var virtualMode: boolean = false;
var virtualCanvas: HTMLCanvasElement = document.createElement("canvas");

const processTurtleCommand = (
  id: number,
  cmd: any,
  canvas: HTMLCanvasElement
) => {
  if (cmd.action === "stop") {
    turtles.forEach((t) => t.stop());
    return Promise.resolve();
  }

  if (cmd.action === "dump") {
    return virtualMode
      ? Promise.resolve(virtualCanvas?.toDataURL())
      : Promise.resolve(canvas.toDataURL());
  }

  if (cmd.action === "mode") {
    // reset the canvas!
    turtleMode = cmd.value;
    clearTurtlesAndCanvas(canvas);
    return Promise.resolve();
  }
  let turtle = turtles.get(id);
  if (!turtle && cmd.action === "reset") {
    // ignore turtle reset if turtle doesn't exist
    return Promise.resolve();
  }
  if (!turtle) {
    turtle = initialiseTurtle(virtualMode ? virtualCanvas : canvas);
    turtles.set(id, turtle);
  }

  try {
    switch (cmd.action) {
      case "forward":
        return turtle.forward(cmd.value);
      case "backward":
        return turtle.back(cmd.value);
      case "right":
        return turtle.right(cmd.value);
      case "left":
        return turtle.left(cmd.value);
      case "setposition":
        return turtle.setposition(
          turtle.canvas.width / 2 + cmd.x,
          turtle.canvas.height / 2 - cmd.y
        );
      case "penup":
        return turtle.penup();
      case "pendown":
        return turtle.pendown();
      case "pensize":
        return turtle.pensize(cmd.value);
      case "setheading":
        return turtle.setheading(cmd.value);
      case "hideturtle":
        return turtle.hideTurtle();
      case "showturtle":
        return turtle.showTurtle();
      case "pencolor":
        if (typeof cmd.value === "string" || cmd.value instanceof String) {
          return turtle.pencolor(cmd.value); // a named color as string or html code
        } else {
          return turtle.pencolor3(cmd.value[0], cmd.value[1], cmd.value[2]); // color tuple
        }
      case "circle":
        return turtle.circle(cmd.radius, cmd.extent);
      /*turtleMode === "logo"
          ? (turtle.state.heading = (turtle.state.heading || 0) - cmd.extent)
          : (turtle.state.heading = (turtle.state.heading || 0) + cmd.extent);*/
      case "begin_fill":
        return turtle.begin_fill();
      case "end_fill":
        return turtle.end_fill();
      case "fillcolor":
        if (typeof cmd.value === "string" || cmd.value instanceof String) {
          return turtle.fillcolor(cmd.value); // a named color as string or html code
        } else {
          return turtle.fillcolor(
            `rgb(${cmd.value[0]},${cmd.value[1]},${cmd.value[2]})`
          ); // color tuple
        }
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

        return turtle.speed(speed_val);
      case "reset":
        return new Promise<void>((r, e) => {
          turtle
            ?.hideTurtle()
            .catch(e)
            .then(() => {
              turtles.delete(id);
              r();
            });
        });
      default:
        return Promise.reject(new Error(`unknown turtle action ${cmd.action}`));
    }
  } catch (err) {
    return Promise.reject(err);
  }
};

const initialiseTurtle: (canvas: HTMLCanvasElement) => SimpleTurtle = (
  canvas
) => {
  let turtle = new SimpleTurtle(canvas, {
    x: 0,
    y: 0,
    heading: turtleMode === "logo" ? TURTLE_LOGO_START_HEADING : 0,
    speed: TURTLE_SPEED_DEFAULT,
    showTurtle: true,
    penDown: true,
    mode: turtleMode,
    pencolor: "black",
    fillcolor: "white",
    virtual: virtualMode,
  }) as SimpleTurtle;
  return turtle;
};

const clearTurtlesAndCanvas = (canvas: HTMLCanvasElement) => {
  turtles.clear();
  canvas.getContext("2d")?.clearRect(0, 0, 1000, 1000);
};

const setVirtualMode = (canvas: HTMLCanvasElement, virtual: boolean) => {
  clearTurtlesAndCanvas(canvas);
  virtualMode = virtual;
  if (virtualMode) {
    virtualCanvas = document.createElement("canvas");
    virtualCanvas.width = canvas.width;
    virtualCanvas.height = canvas.height;
  }
};

export { processTurtleCommand, clearTurtlesAndCanvas, setVirtualMode };
