const imageCache = new Map<string, HTMLImageElement>();

const processCanvasCommand = (context: CanvasRenderingContext2D, cmd: any) => {
  try {
    if (cmd.clearCanvas) {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }
    switch (cmd.action) {
      case "fill":
        context.fill(cmd.fillRule);
        break;
      case "rect":
        context.rect(cmd.x, cmd.y, cmd.width, cmd.height);
        break;     
      case "fillRect":
        context.fillRect(cmd.x, cmd.y, cmd.width, cmd.height);
        break;
      case "strokeRect":
        context.strokeRect(cmd.x, cmd.y, cmd.width, cmd.height);
        break;
      case "clearRect":
        context.clearRect(cmd.x, cmd.y, cmd.width, cmd.height);
        break;             
      case "fillStyle":
        context.fillStyle = cmd.color;
        break;
      case "strokeStyle":
        context.strokeStyle = cmd.color;
        break;
      case "lineWidth":
        context.lineWidth = cmd.value;
        break;
      case "lineCap":
        context.lineCap = cmd.value;
        break;
      case "lineJoin":
        context.lineJoin = cmd.value;
        break;         
      case "miterLimit":
        context.miterLimit = cmd.value;
        break;
      case "setLineDash":
        context.setLineDash(cmd.value);
        break;
      case "lineDashOffset":
        context.lineDashOffset = cmd.value;
        break;                      
      case "font":
        context.font = cmd.value;
        break;
      case "textAlign":
        context.textAlign = cmd.value;
        break;
      case "textBaseline":
        context.textBaseline = cmd.value;
        break;
      case "direction":
        context.direction = cmd.value;
        break;
      case "shadowBlur":
        context.shadowBlur = cmd.value;
        break;
      case "shadowColor":
        context.shadowColor = cmd.value;
        break;
      case "shadowOffsetX":
        context.shadowOffsetX = cmd.value;
        break;
      case "shadowOffsetY":
        context.shadowOffsetY = cmd.value;
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
      case "moveTo":
        context.moveTo(cmd.x, cmd.y);
        break;
      case "lineTo":
        context.lineTo(cmd.x, cmd.y);
        break;
      case "bezierCurveTo":
        context.bezierCurveTo(
          cmd.cp1x, 
          cmd.cp1y,
          cmd.cp2x,
          cmd.cp2y,
          cmd.x,
          cmd.y
        );
        break;
      case "quadraticCurveTo":
        context.quadraticCurveTo(
          cmd.cpx, 
          cmd.cpy,
          cmd.x,
          cmd.y
        );
        break;         
      case "arc":
        context.arc(
          cmd.x,
          cmd.y,
          cmd.radius,
          cmd.startAngle,
          cmd.endAngle,
          cmd.counterclockwise
        );
        break;
      case "arcTo":
        context.arcTo(
          cmd.x1, 
          cmd.y1, 
          cmd.x2, 
          cmd.y2, 
          cmd.radius
        );
        break;
      case "ellipse":
        context.ellipse(
          cmd.x,
          cmd.y,
          cmd.radiusX,
          cmd.radiusY,
          cmd.rotation,
          cmd.startAngle,
          cmd.endAngle,
          cmd.counterclockwise
        );
        break;
      case "filter":
        context.filter = cmd.value;
        break;        
      case "clip":
        context.clip();
        break;
      case "save":
        context.save();
        break;  
      case "restore":
        context.restore();
        break;                             
      case "fillText":
        if (cmd.maxWidth === "") {
          context.fillText(cmd.text, cmd.x, cmd.y);
        } else {
          context.fillText(cmd.text, cmd.x, cmd.y, cmd.maxWidth);
        }
        break;
      case "strokeText":
        if (cmd.maxWidth === "") {
          context.strokeText(cmd.text, cmd.x, cmd.y);
        } else {
          context.strokeText(cmd.text, cmd.x, cmd.y, cmd.maxWidth);
        }
        break;
      case "drawImage":
        if (cmd.maxWidth === "") {
          context.strokeText(cmd.text, cmd.x, cmd.y);
        } else {
          context.strokeText(cmd.text, cmd.x, cmd.y, cmd.maxWidth);
        }

        let cachedImg = imageCache.get(cmd.imageURI);
        if (cachedImg) {
          // serve from local cache
          context.drawImage(cachedImg, cmd.dx, cmd.dy, cmd.dwidth, cmd.dheight);
        } else {
          // create new image
          const img = new Image();
          img.onload = function () {
            context.drawImage(img, cmd.dx, cmd.dy, cmd.dwidth, cmd.dheight);
            imageCache.set(cmd.imageURI, img);
          };
          img.src = cmd.imageURI;
        }
        break;
      case "reset":
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        const width = context.canvas.width;
        context.canvas.width = width; // to trigger reset of all settings
        break;
      default:
        console.log("unknown canvas draw action:");
        console.log(cmd);
    }
  } catch (err) {
    console.log("error processing canvas draw action:");
    console.log(cmd);
  }
};

export { processCanvasCommand };
