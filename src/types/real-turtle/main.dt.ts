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
    heading?: number; // added for Python frontend
    hasMoved?: boolean; // added for Python frontend
  };
  export type RealTurtleOptions = {
    autoStart?: boolean;
    verbose?: boolean;
    async?: boolean;
    image?: string;
    state: RealTurtleOptionsState;
    mode?: "standard" | "logo";
  };
  export default class RealTurtle {
    constructor(canvas: HTMLElement, options: RealTurtleOptions);
    forward(val: number): Promise<void>;
    right(val: number): Promise<void>;
    left(val: number): Promise<void>;
    setPosition(x: number, y: number): Promise<void>;
    back(val: number): Promise<void>;
    penUp(): Promise<void>;
    penDown(): Promise<void>;
    setLineWidth(val: number): Promise<void>;
    setSize(val: number): Promise<void>;
    setSpeed(val: number): Promise<void>;
    setStrokeStyle(val: string): Promise<void>;
    arc(r: number, e: number, c: boolean): Promise<void>;
    beginPath(): Promise<void>;
    closePath(): Promise<void>;
    fill(): Promise<void>;
    setFillStyle(val: string): Promise<void>;
    fake: boolean;
    options: RealTurtleOptions;
    canvas: HTMLCanvasElement;
  }
}
