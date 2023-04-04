import sys
import js
import ast
import traceback
import copy
import time
import os
import json
import re
from collections import deque
from pyodide import to_js

print(sys.version)

class DebugAudio:
    def load(self, source):
        json_map = {"action": "load", "source": source}
        post_message({"cmd": "audio", "msg": json.dumps(json_map)})
    def play(self):
        json_map = {"action": "play"}
        post_message({"cmd": "audio", "msg": json.dumps(json_map)})           

class DebugContext:

    def __init__(self):
        self.width = 500 # fixed
        self.height = 400 # fixed
        self._fillStyle = "black"
        self._strokeStyle = "black"
        self._font = "10px sans-serif"
        self._lineWidth = 1.0
        self._textAlign = "start"
        self._textBaseline = "alphabetic"
        self._lineCap = "butt"
        self._lineJoin = "miter"
        self._miterLimit = 10
        self._lineDashOffset = 0.0
        self._direction = "inherit"
        self._shadowBlur = 0
        self._shadowColor  = "fully-transparent black"
        self._shadowOffsetX = 0
        self._shadowOffsetY = 0        
        self.__commands = []
        # when double buffering is enabled, draw calls are batched
        # and only committed when calling present()
        self.__double_buffering = False

    def _present(self):
        post_message({"cmd": "draw", "msg": json.dumps(self.__commands)})
        self.__commands = []

    def _add_command(self, cmd):
        self.__commands.append(cmd)
        if not self.__double_buffering:
            self._present()

    def present(self):
        self._present()
        # public call of this endpoint implies double buffering
        self.__double_buffering = True

    def fillRect(self, x, y, width, height, clearCanvas=False):
        json_map = {"action": "fillRect", "x": x, "y": y,
                    "width": width, "height": height, "clearCanvas": clearCanvas}
        self._add_command(json_map)

    def rect(self, x, y, width, height):
        json_map = {"action": "rect", "x": x, "y": y,
                    "width": width, "height": height}
        self._add_command(json_map)        

    def strokeRect(self, x, y, width, height, clearCanvas=False):
        json_map = {"action": "strokeRect", "x": x, "y": y,
                    "width": width, "height": height, "clearCanvas": clearCanvas}
        self._add_command(json_map)

    def beginPath(self):
        json_map = {"action": "beginPath"}
        self._add_command(json_map)

    def closePath(self):
        json_map = {"action": "closePath"}
        self._add_command(json_map)

    def fill(self, fillRule="nonzero", clearCanvas=False):
        json_map = {"action": "fill", "fillRule": fillRule,
                    "clearCanvas": clearCanvas}
        self._add_command(json_map)

    def stroke(self):
        json_map = {"action": "stroke"}
        self._add_command(json_map)

    def clip(self):
        json_map = {"action": "clip"}
        self._add_command(json_map)

    def save(self):
        json_map = {"action": "save"}
        self._add_command(json_map)

    def restore(self):
        json_map = {"action": "restore"}
        self._add_command(json_map)     

    def arc(self, x, y, radius, startAngle, endAngle, counterclockwise=False):
        json_map = {"action": "arc", "x": x, "y": y, "radius": radius,
                    "startAngle": startAngle, "endAngle": endAngle, "counterclockwise": counterclockwise}
        self._add_command(json_map)

    def ellipse(self, x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise=False):
        json_map = {"action": "ellipse", "x": x, "y": y, "radiusX": radiusX, "radiusY": radiusY,
                    "rotation": rotation, "startAngle": startAngle, "endAngle": endAngle, "counterclockwise": counterclockwise}
        self._add_command(json_map)

    def arcTo(self, x1, y1, x2, y2, radius):
        json_map = {"action": "arc", "x1": x1, "y1": y1,
                    "x2": x2, "y2": y2, "radius": radius}
        self._add_command(json_map)

    def bezierCurveTo(self, cp1x, cp1y, cp2x, cp2y, x, y):
        json_map = {"action": "bezierCurveTo", "cp1x": cp1x,
                    "cp1y": cp1y, "cp2x": cp2x, "cp2y": cp2y, "x": x, "y": y}
        self._add_command(json_map)

    def quadraticCurveTo(self, cpx, cpy, x, y):
        json_map = {"action": "quadraticCurveTo", "cpx": cpx,
                    "cpy": cpy, "x": x, "y": y}
        self._add_command(json_map)  

    def moveTo(self, x, y):
        json_map = {"action": "moveTo", "x": x, "y": y}
        self._add_command(json_map)

    def clearRect(self, x, y, width, height):
        json_map = {"action": "clearRect", "x": x,
                    "y": y, "width": width, "height": height}
        self._add_command(json_map)

    def lineTo(self, x, y):
        json_map = {"action": "lineTo", "x": x, "y": y}
        self._add_command(json_map)

    def setLineDash(self, value):
        json_map = {"action": "setLineDash", "value": value}
        self._add_command(json_map)                                           

    def fillText(self, text, x, y, maxWidth="", clearCanvas=False):
        json_map = {"action": "fillText", "text": text, "x": x,
                    "y": y, "maxWidth": maxWidth, "clearCanvas": clearCanvas}
        self._add_command(json_map)

    def strokeText(self, text, x, y, maxWidth="", clearCanvas=False):
        json_map = {"action": "strokeText", "text": text, "x": x,
                    "y": y, "maxWidth": maxWidth, "clearCanvas": clearCanvas}
        self._add_command(json_map)

    def reset(self):
        self.__commands = []
        self.double_buffering = False
        json_map = {"action": "reset", "clearCanvas": True}
        self._add_command(json_map)

    def drawImage(self, imageURI, x, y, width, height):
        json_map = {"action": "drawImage", "imageURI": imageURI, "dx": x,
                    "dy": y, "dwidth": width, "dheight": height}
        self._add_command(json_map)        

    def check_key(self, key_code):
        return js.workerCheckKeyDown(key_code)

    @property
    def double_buffering(self):
        return self.__double_buffering

    @double_buffering.setter
    def double_buffering(self, value):
        self.__double_buffering = value

    @property
    def fillStyle(self):
        return self._fillStyle

    @fillStyle.setter
    def fillStyle(self, color):
        self._fillStyle = color
        json_map = {"action": "fillStyle", "color": color}
        self._add_command(json_map)

    @property
    def strokeStyle(self):
        return self._strokeStyle

    @strokeStyle.setter
    def strokeStyle(self, color):
        self._strokeStyle = color
        json_map = {"action": "strokeStyle", "color": color}
        self._add_command(json_map)

    @property
    def lineWidth(self):
        return self._lineWidth

    @lineWidth.setter
    def lineWidth(self, value):
        self._lineWidth = value
        json_map = {"action": "lineWidth", "value": value}
        self._add_command(json_map)

    @property
    def font(self):
        return self._font

    @font.setter
    def font(self, value):
        self._font = value
        json_map = {"action": "font", "value": value}
        self._add_command(json_map)

    @property
    def textAlign(self):
        return self._textAlign

    @textAlign.setter
    def textAlign(self, value):
        self._textAlign = value
        json_map = {"action": "textAlign", "value": value}
        self._add_command(json_map)

    @property
    def textBaseline(self):
        return self._textBaseline

    @textBaseline.setter
    def textBaseline(self, value):
        self._textBaseline = value
        json_map = {"action": "textBaseline", "value": value}
        self._add_command(json_map)

    @property
    def lineCap(self):
        return self._lineCap

    @lineCap.setter
    def lineCap(self, value):
        self._lineCap = value
        json_map = {"action": "lineCap", "value": value}
        self._add_command(json_map)

    @property
    def lineJoin(self):
        return self._lineJoin

    @lineJoin.setter
    def lineJoin(self, value):
        self._lineJoin = value
        json_map = {"action": "lineJoin", "value": value}
        self._add_command(json_map)   

    @property
    def miterLimit(self):
        return self._miterLimit

    @miterLimit.setter
    def miterLimit(self, value):
        self._miterLimit = value
        json_map = {"action": "miterLimit", "value": value}
        self._add_command(json_map)   

    @property
    def lineDashOffset(self):
        return self._lineDashOffset

    @lineDashOffset.setter
    def lineDashOffset(self, value):
        self._lineDashOffset = value
        json_map = {"action": "lineDashOffset", "value": value}
        self._add_command(json_map)

    @property
    def direction(self):
        return self._direction

    @direction.setter
    def direction(self, value):
        self._direction = value
        json_map = {"action": "direction", "value": value}
        self._add_command(json_map)                                                

    @property
    def shadowBlur(self):
        return self._shadowBlur

    @shadowBlur.setter
    def shadowBlur(self, value):
        self._shadowBlur = value
        json_map = {"action": "shadowBlur", "value": value}
        self._add_command(json_map)   

    @property
    def shadowColor(self):
        return self._shadowColor

    @shadowColor.setter
    def shadowColor(self, value):
        self._shadowColor = value
        json_map = {"action": "shadowColor", "value": value}
        self._add_command(json_map)

    @property
    def shadowOffsetX(self):
        return self._shadowOffsetX

    @shadowOffsetX.setter
    def shadowOffsetX(self, value):
        self._shadowOffsetX = value
        json_map = {"action": "shadowOffsetX", "value": value}
        self._add_command(json_map)   

    @property
    def shadowOffsetY(self):
        return self._shadowOffsetY

    @shadowOffsetY.setter
    def shadowOffsetY(self, value):
        self._shadowOffsetY = value
        json_map = {"action": "shadowOffsetY", "value": value}
        self._add_command(json_map)   

    @property
    def filter(self):
        return self._filter

    @filter.setter
    def filter(self, value):
        self._filter = value
        json_map = {"action": "filter", "value": value}
        self._add_command(json_map)     


class DebugOutput:
    def write(self, text):
        post_message({"cmd": "print", "msg": text})


class TestOutput:
    def __init__(self):
        self.buffer = ""

    def clear(self):
        self.buffer = ""

    def write(self, text):
        self.buffer += text


debug_output = DebugOutput()
debug_context = DebugContext()
debug_audio = DebugAudio()
test_output = TestOutput()

active_breakpoints = set()
test_inputs = []
test_outputs = []
step_into = False

# setup turtle library

with open("turtle.py", "w") as file:
    file.write('''
import js
from pyodide import to_js
import json as J
import inspect
_A = "action"
_V = "value"
_idc = 0
def post_message(data):
    js.workerPostMessage(js.Object.fromEntries(to_js(data)))
def mode(mode_type):
    msg = {_A:"mode", _V:mode_type}
    post_message({"cmd": "turtle", "id":-1, "msg": J.dumps(msg)})
def done():pass # no need to do anything
def Screen():return ScreenStub()
class ScreenStub:
    def setup(self, width, height):
        arg = {"cmd": "turtle"}
        arg["msg"] = J.dumps({_A:"setup", "width":width, "height":height})
        post_message(arg)
class Turtle:
    def send(self, msg=None):
      arg = {"cmd": "turtle", "id": self.__id}
      if msg: arg["msg"] = J.dumps(msg)
      post_message(arg)  
    def __init__(self):
      global _idc
      self.__id=_idc;_idc+=1;
      self.send({_A:"reset"})
    def forward(self, dist):self.send({_A:"forward", _V:dist})
    def fd(self, dist):self.forward(dist)
    def setposition(self, x, y):self.send({_A:"setposition", "x":x, "y":y})
    def setpos(self, x, y):self.setposition(x, y)
    def goto(self, x, y):self.setposition(x, y)
    def right(self, angle):self.send({_A:"right", _V:angle})
    def rt(self, angle):self.right(angle)
    def left(self, angle):self.send({_A:"left", _V:angle})
    def lt(self, angle):self.left(angle)
    def backward(self, dist):self.send({_A:"backward", _V:dist})
    def back(self, dist):self.backward(dist)
    def bk(self, dist):self.backward(dist)
    def penup(self):self.send({_A:"penup"})
    def pu(self):self.penup()
    def up(self):self.penup()
    def pendown(self):self.send({_A:"pendown"})
    def pd(self):self.pendown()
    def down(self):self.pendown()
    def speed(self, speed_value):self.send({_A:"speed", _V:speed_value})
    def reset(self):self.send({_A:"reset"})
    def hideturtle(self):self.send({_A:"hideturtle"})
    def showturtle(self):self.send({_A:"showturtle"})
    def home(self):self.setposition(0, 0)
    def pencolor(self, color):self.send({_A:"pencolor", _V:color})
    def setheading(self, angle):self.send({_A:"setheading", _V:angle})
    def color(self, color):self.pencolor(color)
    def pensize(self, size):self.send({_A:"pensize", _V:size})
    def width(self, size):self.pensize(size)
    def circle(self, radius, extent = 360):self.send({_A:"circle", "radius":radius, "extent": extent})
    def begin_fill (self):self.send({_A:"begin_fill"})
    def end_fill(self):self.send({_A:"end_fill"})
    def fillcolor(self, color):self.send({_A:"fillcolor", _V:color})
_t0 = Turtle()
for m in [m for m in dir(_t0) if not m.startswith("_")]:  # reflection magic to expose default turtle
  args = str(inspect.signature(eval(f"Turtle.{m}")))
  args = args.replace("self, ", "").replace("self", "")
  exec(f"def {m}{args}: _t0.{m}{args}")
''')


def pyexec(code, expected_input, expected_output):
    global test_inputs
    global test_outputs
    sys.stdout = test_output
    sys.stderr = test_output
    sys.stdctx = debug_context
    debug_context.double_buffering = False  # assume single buffering
    debug_context.reset()
    sys.stdaud = debug_audio
    time.sleep = test_sleep
    os.system = test_shell
    input = test_input

    test_inputs = expected_input.split("\n") if expected_input else []
    test_outputs = expected_output

    test_output.clear()
    parsed_stmts = ast.parse(code)
    try:
        global_vars = {'hit_breakpoint': hit_breakpoint,
                       'traceback': traceback, 'input': test_input}
        exec(compile(parsed_stmts, filename="YourPythonCode.py",
             mode="exec"), global_vars)
    except Exception as e:
        return js.Object.fromEntries(to_js({"err": "Runtime error", "ins": expected_input}))

    if len(test_inputs) == 1 and test_inputs[0] == '':
        test_inputs = []  # if we have one last blank input stuck in the queue, just ignore it

    # construct matching regex
    expected_output = re.escape(test_outputs)  # initially escape everything
    expected_output = expected_output.replace(
        "\\\n", r"\n").replace("\.\*", ".*")  # restore \n and .*
    expected_output += r"\n*$"  # allow any blank new lines before the end
    js.console.log(str(expected_output))
    js.console.log(str(test_output.buffer))
    if not re.match(expected_output, test_output.buffer):
        js.console.log(str(test_outputs), "!=", str(test_output.buffer))
        return js.Object.fromEntries(to_js({"outcome": False, "err": "Incorrect output", "expected": str(test_outputs), "actual": str(test_output.buffer), "ins": expected_input}))
    elif len(test_inputs) > 0:
        js.console.log("inputs unconsumed: " + str(test_inputs))
        return js.Object.fromEntries(to_js({"outcome": False, "err": "Unconsumed input", "ins": expected_input}))
    else:
        return js.Object.fromEntries(to_js({"outcome": True, "ins": expected_input}))


def pydebug(code, breakpoints):
    global active_breakpoints
    global step_into
    global_vars = {'hit_breakpoint': hit_breakpoint, 'traceback': traceback,
                   'input': debug_input, 'time.sleep': debug_sleep}
    step_into = False
    sys.stdout = debug_output
    sys.stderr = debug_output
    sys.stdctx = debug_context
    debug_context.double_buffering = False  # assume single buffering
    debug_context.reset()
    sys.stdaud = debug_audio
    time.sleep = debug_sleep
    os.system = debug_shell
    input = debug_input

    code = code.replace("import turtle", "import turtle;turtle.mode('standard')")
    parsed_stmts = ast.parse(code)
    parsed_break = ast.parse("hit_breakpoint(99, locals(), globals())")
    active_breakpoints = set(breakpoints)

    injected_breakpoints = set()

    # walk the AST and inject breakpoint commands after each line
    workqueue = deque()  # stores (node, parent). The latter two are needed for instrumentation
    workqueue.extend([(parsed_stmts.body[i], parsed_stmts)
                     for i in range(len(parsed_stmts.body))])
    while workqueue:
        node, parent = workqueue.popleft()
        if node.lineno not in injected_breakpoints:
            break_cmd = copy.deepcopy(parsed_break.body[0])
            break_cmd.value.lineno = node.lineno
            break_cmd.value.end_lineno = node.lineno
            break_cmd.value.args[0] = ast.Constant(
                node.lineno, lineno=0, col_offset=0)
            idx = parent.body.index(node)
            parent.body.insert(idx, break_cmd)
            injected_breakpoints.add(node.lineno)
        if hasattr(node, 'body'):
            workqueue.extend([(node.body[i], node)
                             for i in range(len(node.body))])
    exec(compile(parsed_stmts, filename="YourPythonCode.py", mode="exec"), global_vars)

def pyrun(code):
    global_vars = {'input': debug_input, 'time.sleep': debug_sleep}
    sys.stdout = debug_output
    sys.stderr = debug_output
    sys.stdctx = debug_context
    debug_context.double_buffering = False  # assume single buffering
    debug_context.reset()
    sys.stdaud = debug_audio
    time.sleep = debug_sleep
    os.system = debug_shell
    input = debug_input
    code = code.replace("import turtle", "import turtle;turtle.mode('standard')")
    exec(code, global_vars)    


def update_breakpoints(breakpoints):
    global active_breakpoints
    active_breakpoints = set(breakpoints)


def post_message(data):
    js.workerPostMessage(js.Object.fromEntries(to_js(data)))


def synchronise(typ):
    x = js.XMLHttpRequest.new()
    x.open('get', typ, False)
    x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0')
    x.send()
    return x.response

# input functions


def debug_input(prompt=""):
    if prompt:
        print(prompt, end="")

    post_message({"cmd": "input"})
    resp = json.loads(synchronise('/@input@/req.js'))
    if (resp.get("breakpoints")):
        update_breakpoints(resp["breakpoints"])
    return resp.get("data")


def test_input(prompt=""):
    if prompt:
        print(prompt, end="")
    return test_inputs.pop(0)

# cls


def debug_shell(cmd):
    if cmd == "cls" or cmd == "clear":
        post_message({"cmd": "cls"})


def test_shell():
    pass

# redefine sleep


def debug_sleep(time_in_s):
    synchronise(f'/@sleep@/sleep.js?time={time_in_s}')


def test_sleep(time_in_s):
    pass


def hit_breakpoint(lineno, alocals, aglobals):
    global step_into
    if step_into or lineno in active_breakpoints:
        step_into = False
        # remove wrapper and breakpt method
        stack = traceback.extract_stack()[1:-1]
        VARS_TO_REMOVE = ["__name__", "__main__", "__package__", "__annotations__", "__doc__",
                          "__loader__", "__spec__", "__builtins__", "sys", "js", "ast", "MyOutput", "my_output",
                          "pydebug", "input", "hit_breakpoint", "VARS_TO_REMOVE", "traceback", "sleep", "os", "time"]
        vars = aglobals.copy()
        vars.update(alocals)
        env = {k: str(
            vars[k]) for k in vars if k not in VARS_TO_REMOVE and not callable(vars[k])}

        post_message({"cmd": "breakpt", "lineno": lineno, "env": env})
        resp = json.loads(synchronise('/@debug@/break.js'))
        if (resp.get("breakpoints")):
            update_breakpoints(resp["breakpoints"])
        if (resp.get("step")):
            step_into = True
