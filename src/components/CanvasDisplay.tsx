import React from "react";
import "./CanvasDisplay.css";
import RealTurtle from "real-turtle"

type CanvasDisplayProps = {
};

type CanvasDisplayState = {
  turtle_x_init: number,
  turtle_y_init: number,    
  turtle_x: number,
  turtle_y: number,
  turtle_dir: number
  turtle: any
};

class CanvasDisplay extends React.Component<CanvasDisplayProps, CanvasDisplayState> {

  canvasEl = React.createRef<HTMLCanvasElement>();
  
  state = {
    turtle_x_init: 250,
    turtle_y_init: 200,    
    turtle_x: 250,
    turtle_y: 200,
    turtle_dir: 0,
    turtle: {"forward": (val:number) => {}, "right": (val:number) => {}, "left": (val:number) => {}, "setPosition": (x:number, y:number) => {}, "fake": true}
  };

  /*
  constructor(props: CanvasDisplayProps) {
    super(props);
  } 
  */

  runTurtleCommand(msg:string) {
    const canvas: HTMLCanvasElement = document.getElementById('canvasDisplay') as HTMLCanvasElement;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    console.log(msg)
    if(this.state.turtle.fake) {
      this.setState({"turtle": new RealTurtle(document.getElementById("canvasDisplay"), {"autoStart":true})})
    }
    
    try {
      const turtleObj = JSON.parse(msg);
      switch(turtleObj.action) { 
        case "forward":
          /*
          context.moveTo(this.state.turtle_x, this.state.turtle_y);
          const new_x = this.state.turtle_x + Math.sin(this.state.turtle_dir) * turtleObj.value;
          const new_y = this.state.turtle_y - Math.cos(this.state.turtle_dir) * turtleObj.value;
          context.lineTo(new_x, new_y);
          this.setState({turtle_x: new_x, turtle_y: new_y})
          context.stroke();
          */
          this.state.turtle.forward(turtleObj.value);            
          break;
        case "right":
            this.state.turtle.right(turtleObj.value); 
            // this.setState({turtle_dir: this.state.turtle_dir + (Math.PI / 180) * turtleObj.value});
            break;
        case "left":
            this.state.turtle.left(turtleObj.value); 
            // this.setState({turtle_dir: this.state.turtle_dir - (Math.PI / 180) * turtleObj.value});
            break;                         
        case "setposition":
            this.state.turtle.setPosition(turtleObj.x, turtleObj.y)
            // this.setState({turtle_x: turtleObj.x, turtle_y: turtleObj.y});
            // context.moveTo(this.state.turtle_x_init, this.state.turtle_y_init);
          break;          
        case "reset":
          // this.setState({turtle_x: this.state.turtle_x_init, turtle_y: this.state.turtle_y_init});
          // context.moveTo(this.state.turtle_x_init, this.state.turtle_y_init);
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
          this.setState({"turtle": new RealTurtle(document.getElementById("canvasDisplay"), {"autoStart":true})})
          break;
      }
    }
    catch(err) {
      console.log("error processing canvas turtle action:");
      console.log(msg);
    }
  }

  runCommand(msg:string) {
    console.log(msg);
    const canvas: HTMLCanvasElement = document.getElementById('canvasDisplay') as HTMLCanvasElement;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;

    try {
      const drawObj = JSON.parse(msg);
      if(drawObj.clearCanvas){
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      }
      switch(drawObj.action) {        
        case "fill":
          context.fill(drawObj.fillRule);
          break;
        case "fillRect":
          context.fillRect(drawObj.x, drawObj.y, drawObj.width, drawObj.height);
          break;
        case "strokeRect":
          context.strokeRect(drawObj.x, drawObj.y, drawObj.width, drawObj.height);
          break;
        case "clearRect":
          context.clearRect(drawObj.x, drawObj.y, drawObj.width, drawObj.height);
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
          break ;   
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
          context.arc(drawObj.x, drawObj.y, drawObj.radius, drawObj.startAngle, drawObj.endAngle, drawObj.counterclockwise);
          break;
        case "ellipse":
          context.ellipse(drawObj.x, drawObj.y, drawObj.radiusX, drawObj.radiusY, drawObj.rotation, drawObj.startAngle, drawObj.endAngle, drawObj.counterclockwise)
          break;
        case "arcTo":
          context.arcTo(drawObj.x1, drawObj.y1, drawObj.x2, drawObj.y2, drawObj.radius)
          break;
        case "bezierCurveTo":
          context.bezierCurveTo(drawObj.cp1x, drawObj.cp1y, drawObj.cp2x, drawObj.cp2y, drawObj.x, drawObj.y)
          break;
        case "fillText":
          if(drawObj.maxWidth === "") {
            context.fillText(drawObj.text, drawObj.x, drawObj.y);
          } else {
            context.fillText(drawObj.text, drawObj.x, drawObj.y, drawObj.maxWidth);
          }
          break;
        case "strokeText":
          if(drawObj.maxWidth === "") {
            context.strokeText(drawObj.text, drawObj.x, drawObj.y);
          } else {
            context.strokeText(drawObj.text, drawObj.x, drawObj.y, drawObj.maxWidth);
          }          
          break;                                                                                
        default:
          console.log("unknown canvas draw action:");
          console.log(msg);
      }
    }
    catch(err) {
      console.log("error processing canvas draw action:");
      console.log(msg);
    }  
  }

  render() {
    return (
        <div style={{ width: "100%", height: "100%" }} className="graphicsPane">
          <canvas
            id="canvasDisplay"
            width="500"
            height="400"
            ref = {this.canvasEl}
          />
        </div>
    );
  }
}

export default CanvasDisplay;

// <script type="text/javascript" src="https://unpkg.com/real-turtle"></script>