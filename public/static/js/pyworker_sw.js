importScripts("https://cdn.jsdelivr.net/pyodide/v0.19.1/full/pyodide.js");

// communication with the main site
// there are two commands implemented at the moment:
//   run(code) which runs a piece of code
//   input(data) which provides the input from the user to a currently blocked code
// the assumption is that run will not be called while there is an active Python code running
// also, there is an assumption that there cannot be two synchronouse inputs
onmessage = function(e) {
    if (e.data.cmd === "setInterruptBuffer") {
        if (self.pyodide) {
            self.pyodide.setInterruptBuffer(e.data.interruptBuffer)
            self.interruptBufferToSet = null;
        } else {
            self.interruptBufferToSet = e.data.interruptBuffer;
        }
    }
    else if (e.data.cmd === "debug") {
        let reason = "ok"
        try {
            self.pyodide.globals.get("pydebug")(e.data.code, e.data.breakpoints)
        }  
        catch (err) {
            if (err.message.includes("KeyboardInterrupt")) {
                reason = "interrupt"
            }
            else {
                workerPrint(err);
                reason = "error"
            }
        }
        self.postMessage({"cmd": "debug-finished", reason});
    } else if (e.data.cmd === "test") {
        let results = e.data.tests.map((t) => {return {outcome: false, err: "Failed to compile"}});
        console.log("running tests")
        try {
            let tests = e.data.tests
            results = tests.map((test) => self.pyodide.globals.get("pyexec")(e.data.code, test.in, test.out))
        }
        catch (err) {
            if (err.message.includes("KeyboardInterrupt")) {
                results = e.data.tests.map((t) => {return {outcome: false, err: "Interrupted"}});
            }
        }
        self.postMessage({"cmd": "test-finished", results});
    }
}

// loading code
let loadPyodideAsync = async () => {
    self.pyodide = await loadPyodide({ indexURL : "https://cdn.jsdelivr.net/pyodide/v0.19.0/full/"});
    if (self.interruptBufferToSet) {
        self.pyodide.setInterruptBuffer(self.interruptBufferToSet)
        self.interruptBufferToSet = null
    }
    await self.pyodide.runPython(initPyCode);
}
loadPyodideAsync().then(() => self.postMessage({"cmd": "init-done"}));

// js proxy posting messages. Used from Python
// eslint-disable-next-line no-unused-vars
function workerPostMessage(msg) { self.postMessage(msg); }
function workerPrint(msg) { self.postMessage({"cmd": "print", "msg": msg}); }

// Initial Python script to set up stout, stderr and input redirect
const initPyCode = `
import sys
import js
import ast
import traceback
import copy
import time
import os
import json
from collections import deque
from pyodide import to_js

print(sys.version)
class DebugOutput:
    def write(self, text):
        post_message({"cmd": "print", "msg": text}); 

class TestOutput:
    def __init__(self):
        self.buffer = ""

    def clear(self):
        self.buffer = ""

    def write(self, text):
        self.buffer += text

debug_output = DebugOutput()
test_output = TestOutput()

active_breakpoints = set()
test_inputs = []
test_outputs = []
step_into = False

def pyexec(code, expected_input, expected_output):
    global test_inputs
    global test_outputs
   

    sys.stdout = test_output
    sys.stderr = test_output
    time.sleep = test_sleep
    os.system = test_shell
    input = test_input

    test_inputs = expected_input.split("\\n") if expected_input else []
    test_outputs = expected_output

    test_output.clear()
    parsed_stmts = ast.parse(code)
    try:
        global_vars = {'hit_breakpoint': hit_breakpoint, 'traceback': traceback, 'input': test_input}
        exec(compile(parsed_stmts, filename="YourPythonCode.py", mode="exec"), global_vars)
    except Exception as e:
        return js.Object.fromEntries(to_js({"err": "Runtime error", "ins": expected_input}))

    if len(test_inputs) == 1 and test_inputs[0] == '':
        test_inputs = []  # if we have one last blank input stuck in the queue, just ignore it 

    if test_outputs != test_output.buffer:
        js.console.log(str(test_outputs), "!=", str(test_output.buffer))
        return js.Object.fromEntries(to_js({"outcome": False, "err": "Incorrect output", "expected": str(test_outputs), "actual": str(test_output.buffer), "ins": expected_input}))
    elif len(test_inputs) > 0:
        js.console.log("inputs unconsumed: " + str(test_inputs))
        return js.Object.fromEntries(to_js({"outcome": False, "err": "Unconsumed input", "ins": expected_input}))
    else:
        return js.Object.fromEntries(to_js({"outcome": True, "ins": expected_input}))

def pydebug(code, breakpoints):
    global global_vars
    global active_breakpoints
    global_vars = {'hit_breakpoint': hit_breakpoint, 'traceback': traceback, 'input': debug_input, 'time.sleep': debug_sleep}
    global step_into
    step_into = False
    sys.stdout = debug_output
    sys.stderr = debug_output
    time.sleep = debug_sleep
    os.system = debug_shell
    input = debug_input
    
    parsed_stmts = ast.parse(code)
    parsed_break = ast.parse("hit_breakpoint(99, locals(), globals())")
    active_breakpoints = set(breakpoints)

    injected_breakpoints = set()

    # walk the AST and inject breakpoint commands after each line
    workqueue = deque()  # stores (node, idx_in_parent, parent). The latter two are needed for instrumentation
    workqueue.extend([(parsed_stmts.body[i], parsed_stmts) for i in range(len(parsed_stmts.body))])
    while workqueue:
        node, parent = workqueue.popleft()
        if node.lineno not in injected_breakpoints:
            #js.console.log(str(node.lineno) +  str(node))
            break_cmd = copy.deepcopy(parsed_break.body[0])
            break_cmd.value.lineno = node.lineno
            break_cmd.value.end_lineno = node.lineno
            break_cmd.value.args[0] = ast.Constant(node.lineno, lineno=0, col_offset=0)
            idx = parent.body.index(node)
            parent.body.insert(idx, break_cmd)
            injected_breakpoints.add(node.lineno)
        if hasattr(node, 'body'):
            workqueue.extend([(node.body[i], node) for i in range(len(node.body))])
    #js.console.log(str(parsed_stmts.body))
    exec(compile(parsed_stmts, filename="YourPythonCode.py", mode="exec"), global_vars)

def update_breakpoints(breakpoints):
    global active_breakpoints
    active_breakpoints = set(breakpoints)


def post_message(data):
    js.workerPostMessage(js.Object.fromEntries(to_js(data)))

def synchronise(typ):
    x = js.XMLHttpRequest.new();
    x.open('get', typ, False);
    x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
    x.send()
    return x.response

# input functions
def debug_input(prompt = ""):
    if prompt: 
        print(prompt, end="")

    post_message({"cmd": "input"})
    resp = json.loads(synchronise('/@input@/req.js'))
    if (resp.get("breakpoints")):
        update_breakpoints(resp["breakpoints"])
    return resp.get("data")

def test_input(prompt = ""):
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
        stack = traceback.extract_stack()[1:-1]  # remove wrapper and breakpt method
        VARS_TO_REMOVE = ["__name__", "__main__", "__package__", "__annotations__", "__doc__", 
            "__loader__", "__spec__", "__builtins__", "sys", "js", "ast", "MyOutput", "my_output",
            "pydebug", "input", "hit_breakpoint", "VARS_TO_REMOVE", "traceback", "sleep", "os", "time"]
        vars = aglobals.copy()
        vars.update(alocals)
        env = { k:str(vars[k]) for k in vars if k not in VARS_TO_REMOVE and not callable(vars[k])}

        post_message({"cmd": "breakpt", "lineno": lineno, "env": env})
        resp = json.loads(synchronise('/@debug@/break.js'))
        if (resp.get("breakpoints")):
            update_breakpoints(resp["breakpoints"])
        if (resp.get("step")):
            step_into = True

`
