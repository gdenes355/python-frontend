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
from pyodide.ffi import to_js

print(sys.version)

class NotEnoughInputsError(Exception):
    pass

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

active_breakpoints = set()  # set of line numbers that have active breakpoints
breakpoint_map = {}  # map all lines (including empty) to a breakpointable line
step_into = False  # step into the next instruction
last_seen_lineno = -1  # keep track of the last seen line number, so we don't double break on a line
test_inputs = []

# setup turtle library

with open("turtle.py", "w") as file:
    file.write('''
import js
import struct
from pyodide.ffi import to_js
import json as J
import inspect
_A = "action"
_V = "value"
_idc = 0
def synchronise():
    x = js.XMLHttpRequest.new()
    x.open('get', '/@turtle@/req.js', False)
    x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0')
    x.send()
    if x.status != 200:
        raise Exception("Turtle command failed")
    return x.response
def post_message(data):
    js.workerPostMessage(js.Object.fromEntries(to_js(data)))
def mode(mode_type):
    msg = {_A:"mode", _V:mode_type}
    post_message({"cmd": "turtle", "msg": J.dumps(msg)})
    synchronise()
def done(): 
    msg = {_A:"done"}
    post_message({"cmd": "turtle", "msg": J.dumps(msg)})
    synchronise()
class Turtle:
    
    def send(self, msg=None):
      arg = {"cmd": "turtle", "id": self.__id}
      if msg: arg["msg"] = J.dumps(msg)
      post_message(arg)
      synchronise()
    def __init__(self):
      global _idc
      self.__id=_idc;_idc+=1;
      # self.send({_A:"reset"})
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
    def pencolor(self, color, color2=-1, color3=-1):
        if color2 == -1 and color3 == -1:
            self.send({_A:"pencolor", _V:color})
        else:
            rgb = (color,color2,color3)
            self.send({_A:"pencolor", _V:"#" + struct.pack('BBB',*rgb).hex()})
    def setheading(self, angle):self.send({_A:"setheading", _V:angle})
    def color(self, color, color2=-1, color3=-1): self.pencolor(color, color2, color3)
    def pensize(self, size):self.send({_A:"pensize", _V:size})
    def width(self, size):self.pensize(size)
    def circle(self, radius, extent = 360):self.send({_A:"circle", "radius":radius, "extent": extent})
    def begin_fill (self):self.send({_A:"begin_fill"})
    def end_fill(self):self.send({_A:"end_fill"})
    def fillcolor(self, color, color2=-1, color3=-1):
        if color2 == -1 and color3 == -1:
            self.send({_A:"fillcolor", _V:color})
        else:
            rgb = (color,color2,color3)
            self.send({_A:"fillcolor", _V:"#" + struct.pack('BBB',*rgb).hex()})
_t0 = Turtle()
for m in [m for m in dir(_t0) if not m.startswith("_")]:  # reflection magic to expose default turtle
  args = str(inspect.signature(eval(f"Turtle.{m}")))
  args = args.replace("self, ", "").replace("self", "")
  exec(f"def {m}{args}: _t0.{m}{args}")

''')


def pyexec(code, expected_input, expected_output):
    global test_inputs
    sys.stdout = test_output
    sys.stderr = test_output
    sys.stdctx = debug_context
    debug_context.double_buffering = False  # assume single buffering
    debug_context.reset()
    sys.stdaud = debug_audio
    time.sleep = test_sleep
    os.system = test_shell
    input = test_input
    
    # ensure turtle canvas cleared if used
    code = code.replace("import turtle", "import turtle;turtle.mode('standard')")

    # prepare inputs
    if not expected_input:
        test_inputs = []  # no input for this test case
    elif isinstance(expected_input, str):
        test_inputs = expected_input.split("\n")  # string input; split it on new lines
    else:
        test_inputs = [str(inp) for inp in expected_input]  # must be a list of inputs; cast each to be a string to be safe
    test_input_copy = copy.deepcopy(test_inputs)

    # run test
    test_output.clear()
    parsed_stmts = ast.parse(code)
    try:
        global_vars = {'hit_breakpoint': hit_breakpoint,
                       'traceback': traceback, 'input': test_input}
        exec(compile(parsed_stmts, filename="YourPythonCode.py",
             mode="exec"), global_vars)
    except NotEnoughInputsError:
        return js.Object.fromEntries(to_js({"err": "You've requested too many inputs", "ins": expected_input}))
    except Exception as e:
        return js.Object.fromEntries(to_js({"err": "Runtime error", "ins": expected_input}))

    if len(test_inputs) == 1 and test_inputs[0] == '':
        test_inputs = []  # if we have one last blank input stuck in the queue, just ignore it

    # start output validation
    if len(test_inputs) > 0:
        return js.Object.fromEntries(to_js({"outcome": False, "err": "Unconsumed input", "ins": expected_input}))

    original_expected_output = expected_output

    if isinstance(expected_output, str):
        # Simple case: just a string. We respect \n and .* as special characters and ignore \n* at the end
        expected_output = re.escape(expected_output).replace("\\\n", r"\n").replace("\.\*", ".*") + r"\n*$"        
        if not re.match(expected_output, test_output.buffer):
            return js.Object.fromEntries(to_js({"outcome": False, "err": "Incorrect output", "expected": str(original_expected_output), "actual": str(test_output.buffer), "ins": expected_input}))
        else:
            return js.Object.fromEntries(to_js({"outcome": True, "ins": expected_input}))
    else:
        # Must be a list of requirements
        criteria_outcomes = []
        for requirement in expected_output:
            requirement = requirement.as_object_map()
            typ = requirement.get("typ", "+")
            pattern = requirement.get("pattern","")  # the pattern to match. Must be present unless turtle

            if typ[0] == "c":
                test_string = code
            elif typ[0] == "f":
                # get file contents from filename
                filename = requirement.get("filename")
                if not filename:
                    return js.Object.fromEntries(to_js({"outcome": False, "err": "Missing filename in test case", "ins": expected_input}))
                try:
                    with open(filename, "r") as f:
                        test_string = f.read()
                except FileNotFoundError:
                    return js.Object.fromEntries(to_js({"outcome": False, "err": "File not found", "ins": expected_input}))
                except Exception as e:
                    return js.Object.fromEntries(to_js({"outcome": False, "err": "Unknown error reading file", "ins": expected_input}))
            elif typ[0] == "s":
                # get string from evaluating a code statement - find a neater/more efficient way to do this?
                if "statement" not in requirement:
                    return js.Object.fromEntries(to_js({"outcome": False, "err": "Missing statement in test case", "ins": expected_input}))
                try:
                    test_string = str(eval(requirement.get("statement"), global_vars))
                except Exception as e:
                    return js.Object.fromEntries(to_js({"outcome": False, "err": "Error evaluating test-case statement", "ins": expected_input}))
            elif typ[0] == "t":
                # evaluate turtle canvas result comparison with code from filename
                if "filename" not in requirement:
                    return js.Object.fromEntries(to_js({"outcome": False, "err": "Missing turtle solution filename in test case", "ins": expected_input}))
                try:
                    # the filename has been replaced with the soln code
                    screen_dump_user = run_turtle_cmd({"action":"dump", "value":""})
                    # now using virtual for both user & soln, must ensure reset between runs
                    run_turtle_cmd({"action":"mode", "value":"standard"})
                    test_inputs = copy.deepcopy(test_input_copy)
                    exec(requirement.get("filename"), global_vars)
                    screen_dump_soln = run_turtle_cmd({"action":"dump", "value":""})  
                    if screen_dump_user != screen_dump_soln:
                        return js.Object.fromEntries(to_js({"outcome": False, "err": "Incorrect turtle output", "ins": expected_input}))
                    else:
                        return js.Object.fromEntries(to_js({"outcome": True, "ins": expected_input}))
                except Exception as e:                   
                    return js.Object.fromEntries(to_js({"outcome": False, "err": "Error evaluating turtle canvas test-case", "ins": expected_input}))
            else:
                test_string = test_output.buffer

            ignore = requirement.get("ignore", "")
            expected_count = int(requirement.get("count", -1))

            # first, deal with the tricky ignore cases  w: whitespace, c: case, p: punctuation
            flags = (re.IGNORECASE if "c" in ignore else 0) | re.DOTALL
            if "w" in ignore:  
                # no lib support for this, so we just strip whitespaces from both the actual and the expected
                # not a perfect strategy though, as user might have \s, \t, \n in their regex. 
                # But then really they shouldn't write a regex that tests for whitespace and ask us to ignore white space
                test_string = re.sub(r"\s+", "", test_string)
                pattern = re.sub(r"\s+", "", pattern)
            
            if "p" in ignore:
                # similar to whitespace, this is a bit of a hack
                # remove all punctuations from the actual
                test_string = re.sub(r"[^\w*\s]", "", test_string)
                # from expected, do a quick hack to remove a few common punctuations including .,?!:;"'
                # This is not a perfect solution, but it's good enough for most cases
                pattern = re.sub(r";|:|\\\.|,|\\\?|\\\!|\"|'|\\\/", "", pattern)

            actual_count = len(re.findall(pattern, test_string, flags))
            outcome = True
            if "+" in typ:
                if actual_count == 0 or ((expected_count != -1) and (expected_count != actual_count)):
                    outcome = False
            elif "-" in typ:
                if actual_count > 0 or (expected_count != -1 and expected_count == actual_count):
                    outcome = False
            criteria_outcomes.append(outcome)
        # Yay, We got this far without failing!
        if False in criteria_outcomes:
            return js.Object.fromEntries(to_js({"outcome": False, "err": "Incorrect output", "expected": original_expected_output, "criteriaOutcomes": criteria_outcomes, "actual": test_output.buffer, "ins": expected_input}))
        else:
            return js.Object.fromEntries(to_js({"outcome": True, "ins": expected_input}))

                    



def pydebug(code, breakpoints):
    global active_breakpoints
    global step_into
    global breakpoint_map
    global last_seen_lineno
    global_vars = {'hit_breakpoint': hit_breakpoint, 'traceback': traceback,
                   'input': debug_input, 'time.sleep': debug_sleep}
    step_into = False
    last_seen_lineno = -1
    sys.stdout = debug_output
    sys.stderr = debug_output
    sys.stdctx = debug_context
    debug_context.double_buffering = False  # assume single buffering
    debug_context.reset()
    sys.stdaud = debug_audio
    time.sleep = debug_sleep
    os.system = debug_shell
    input = debug_input

    # ensure turtle canvas cleared if used
    code = code.replace("import turtle", "import turtle;turtle.mode('standard')")

    parsed_stmts = ast.parse(code)
    parsed_break = ast.parse("hit_breakpoint(99, locals(), globals(), False)")
    breakpoint_map = {}

    injected_breakpoints = set()

    # walk the AST and inject breakpoint commands after each line
    workqueue = deque()  # stores (node, parent). The latter two are needed for instrumentation
    workqueue.extend([(parsed_stmts.body[i], parsed_stmts.body) for i in range(len(parsed_stmts.body))])
    last_line = 0
    CHILDREN_TO_EXPLORE = ['body', 'orelse',  'finalbody']

    # walk the AST and inject breakpoint commands on each line
    while workqueue:
        node, parentl = workqueue.popleft()
        if node.lineno in injected_breakpoints:
            continue
        break_cmd = copy.deepcopy(parsed_break.body[0])
        break_cmd.value.lineno, break_cmd.value.end_lineno, break_cmd.value.args[0] = node.lineno, node.lineno, ast.Constant(node.lineno, lineno=0, col_offset=0)
        idx = parentl.index(node)
        parentl.insert(idx, break_cmd)
        injected_breakpoints.add(node.lineno)
        last_line = max(last_line, node.lineno)
        for t in CHILDREN_TO_EXPLORE:
            if hasattr(node, t):
                workqueue.extend([(getattr(node, t)[i], getattr(node, t)) for i in range(len(getattr(node, t)))])
        if hasattr(node, 'handlers'):
            # instrument handlers with break
            for handler in node.handlers:
                if hasattr(handler, 'body'):
                    workqueue.extend([(handler.body[i], handler.body) for i in range(len(handler.body))])
        if hasattr(node, 'test'):
            # instrument test with break
            break_cmd.value.args[3] = ast.Constant(True, lineno=0, col_offset=0)
            node.test = ast.BoolOp(ast.And(), [break_cmd.value, node.test], lineno=node.lineno, col_offset=1)
            
    # find lines with no breakpoints and map them to the next line with a breakpoint
    nextbrk = last_line
    for lineno in range(last_line, -1, -1):
        if lineno in injected_breakpoints:
            nextbrk = lineno
        breakpoint_map[lineno] = nextbrk
    update_breakpoints(breakpoints)
    exec(compile(parsed_stmts, filename="YourPythonCode.py", mode="exec"), global_vars)


def pyrun(code):
    global_vars = {'input': debug_input, 'time.sleep': debug_sleep}

    # ensure turtle canvas cleared if used
    code = code.replace("import turtle", "import turtle;turtle.mode('standard')")

    sys.stdout = debug_output
    sys.stderr = debug_output
    sys.stdctx = debug_context
    debug_context.double_buffering = False  # assume single buffering
    debug_context.reset()
    sys.stdaud = debug_audio
    time.sleep = debug_sleep
    os.system = debug_shell
    input = debug_input

    exec(code, global_vars)


def update_breakpoints(breakpoints):
    global active_breakpoints
    active_breakpoints = set([breakpoint_map.get(b, b) for b in breakpoints])


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
    if (js.workerInterrupted()):
        raise KeyboardInterrupt()
    if (resp.get("breakpoints")):
        update_breakpoints(resp["breakpoints"])
    return resp.get("data")


def test_input(prompt=""):
    if prompt:
        print(prompt, end="")
    if len(test_inputs) == 0:
        raise NotEnoughInputsError()
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

# turtle
def run_turtle_cmd(msg):
    post_message({"cmd": "turtle", "msg": json.dumps(msg)})
    return synchronise('/@turtle@/req.js')   


def hit_breakpoint(lineno, alocals, aglobals, is_secondary=False):
    global step_into
    global last_seen_lineno
    if is_secondary and last_seen_lineno == lineno:
        return True
    last_seen_lineno = lineno
    if step_into or lineno in active_breakpoints:
        step_into = False
        # remove wrapper and breakpt method
        stack = traceback.extract_stack()[1:-1]
        VARS_TO_REMOVE = ["__name__", "__main__", "__package__", "__annotations__", "__doc__",
                          "__loader__", "__spec__", "__builtins__", "sys", "js", "ast", "MyOutput", "my_output",
                          "pydebug", "input", "hit_breakpoint", "VARS_TO_REMOVE", "traceback", "sleep", "os", "time", "last_seen_lineno"]
        globals = {k: repr(aglobals[k]) for k in aglobals if k not in VARS_TO_REMOVE and not callable(aglobals[k])}
        if alocals != aglobals:
            locals = {k: repr(alocals[k]) for k in alocals if k not in VARS_TO_REMOVE and not callable(alocals[k])}
        else:
            locals = {}

        post_message({"cmd": "breakpt", "lineno": lineno, "globals": globals, "locals": locals})
        resp = json.loads(synchronise('/@debug@/break.js'))
        if (resp.get("breakpoints")):
            update_breakpoints(resp["breakpoints"])
        if (resp.get("step")):
            step_into = True
    return True
