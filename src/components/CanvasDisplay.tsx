import React from "react";
import "./CanvasDisplay.css";

type CanvasDisplayProps = {
};

type CanvasDisplayState = {
};

class CanvasDisplay extends React.Component<CanvasDisplayProps, CanvasDisplayState> {

  canvasEl = React.createRef<HTMLCanvasElement>();
  
  state = {
  };

  /*
  constructor(props: CanvasDisplayProps) {
    super(props);
  } 
  */

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
