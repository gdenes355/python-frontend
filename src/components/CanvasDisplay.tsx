import React from "react";
import "./CanvasDisplay.css";
import RealTurtle from "real-turtle"

type CanvasDisplayProps = {
};

type CanvasDisplayState = {
  turtle: any
};

class CanvasDisplay extends React.Component<CanvasDisplayProps, CanvasDisplayState> {

  canvasEl = React.createRef<HTMLCanvasElement>();
  
  state = {
    turtle: {
      "forward": (val:number) => {}, 
      "right": (val:number) => {}, 
      "left": (val:number) => {}, 
      "setPosition": (x:number, y:number) => {}, 
      "back": (val:number) => {}, 
      "penUp": () => {}, 
      "penDown": () => {}, 
      "setLineWidth": (val:number) => {}, 
      "setSize": (val:number) => {},
      "setSpeed": (val:number) => {},      
      "setStrokeColorRGB": (r:number, g:number, b:number) => {},
      "arc": (r:number, e:number) => {},
      "fake": true}
  };

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
          this.state.turtle.forward(turtleObj.value);            
          break;
        case "backward":
          this.state.turtle.back(turtleObj.value);            
          break;          
        case "right":
          this.state.turtle.right(turtleObj.value); 
          break;
        case "left":
          this.state.turtle.left(turtleObj.value); 
          break;                         
        case "setposition":
          this.state.turtle.setPosition(turtleObj.x, turtleObj.y);
          break; 
        case "penup":
          this.state.turtle.penUp();
          break;
        case "pendown":
          this.state.turtle.penDown();
          break;
        case "pensize":
          this.state.turtle.setLineWidth(turtleObj.value);
          break;
        case "hideturtle":
          this.state.turtle.setSize(0);
          break;
        case "showturtle":
          this.state.turtle.setSize(15); // default
          break;
        case "pencolor":
          this.state.turtle.setStrokeColorRGB(turtleObj.r, turtleObj.g, turtleObj.b); 
          break;
        case "circle":
          this.state.turtle.arc(turtleObj.radius, turtleObj.extent);
          break;
        case "speed":
          let speed_val = 0.5;
          switch(turtleObj.value) {
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
              speed_val = 0
              break;
            default:
              speed_val = turtleObj.value === 0 ? 1 : (turtleObj.value / 10); 
          }
          
          this.state.turtle.setSpeed(speed_val);
          break;                                                      
        case "reset":
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
          this.setState({"turtle": new RealTurtle(document.getElementById("canvasDisplay"), {"autoStart":true})});
          this.state.turtle.setPosition(0, 0);
          this.state.turtle.setLineWidth(1);
          this.state.turtle.setSpeed(0.5);
          this.state.turtle.setSize(15); // default
          this.state.turtle.setStrokeColorRGB(0, 0, 0); 
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