declare module "real-turtle" {
  export type RealTurtleOptionsState = {
    strokeStyle?: string;
    fillStyle?: string;
    lineCap?: string;
    lineJoin?: string;
    font?: string;
    lineWidth?: number;
    size?: number;
    speed?: number;
  };
  export type RealTurtleOptions = {
    autoStart?: boolean;
    verbose?: boolean;
    async?: boolean;
    image?: string;
    state?: RealTurtleOptionsState;
  };
  export default class RealTurtle {
    constructor(canvas: HTMLElement, options: RealTurtleOptions);
    forward(val: number): void;
    right(val: number): void;
    left(val: number): void;
    setPosition(x: number, y: number): void;
    back(val: number): void;
    penUp(): void;
    penDown(): void;
    setLineWidth(val: number): void;
    setSize(val: number): void;
    setSpeed(val: number): void;
    setStrokeStyle(val: string): void;
    arc(r: number, e: number, c: boolean): void;
    beginPath(): void;
    closePath(): void;
    fill(): void;
    setFillStyle(val: string): void;
    fake: boolean;
    options: RealTurtleOptions;
  }
}
