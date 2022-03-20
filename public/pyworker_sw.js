importScripts("https://cdn.jsdelivr.net/pyodide/v0.19.1/full/pyodide.js");

// communication with the main site
// there are two commands implemented at the moment:
//   run(code) which runs a piece of code
//   input(data) which provides the input from the user to a currently blocked code
// the assumption is that run will not be called while there is an active Python code running
// also, there is an assumption that there cannot be two synchronouse inputs
onmessage = function(e) {
    if (e.data.cmd === "debug") {
        let reason = "ok"
        try {
            self.pyodide.globals.get("pydebug")(e.data.code, e.data.breakpoints)
        }  
        catch (err) {
            workerPrint(err);
            reason = "error"
        }
        self.postMessage({"cmd": "debug-finished", reason});
    } else if (e.data.cmd === "test") {
        let results = e.data.tests.map((t) => {return {err: "Failed to compile"}});
        console.log("running tests")
        try {
            let tests = e.data.tests
            results = tests.map((test) => self.pyodide.globals.get("pyexec")(e.data.code, test.in, test.out))
        }
        catch (err) {
            // silent failure
        }
        self.postMessage({"cmd": "test-finished", results});
    }
}

// loading code
let loadPyodideAsync = async () => {
    self.pyodide = await loadPyodide({ indexURL : "https://cdn.jsdelivr.net/pyodide/v0.19.0/full/"});
    await self.pyodide.runPython(initPyCode);
}
loadPyodideAsync().then(() => self.postMessage({"cmd": "init-done"}));

// js proxy for input and print. These are passed on to the main site
workerPrint = function(msg) { self.postMessage({"cmd": "print", "msg": msg}); }
workerInput = () => {
    self.postMessage({"cmd": "input"});
    var x = new XMLHttpRequest();
    x.open('get', '/@input@/req.js', false);
    x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
    x.send()
    let resp = JSON.parse(x.response)
    if (resp.breakpoints) {
        self.pyodide.globals.get("update_breakpoints")(resp.breakpoints)
    }
    return resp.data
} 

workerBreakpoint = (lineno, env) => {
    env = env.toJs();
    self.postMessage({cmd: "breakpt", lineno, env})
    var x = new XMLHttpRequest();
    x.open('get', '/@debug@/break.js', false);
    x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
    x.send()
    let resp = JSON.parse(x.response)
    if (resp.breakpoints) {
        self.pyodide.globals.get("update_breakpoints")(resp.breakpoints)
    }
    if (resp.step) {
        self.pyodide.globals.get("prepare_step")()
    }
    return
}

workerSleep = (timeInS) => {
    var x = new XMLHttpRequest();
    x.open('get', '/@sleep@/sleep.js?time='+timeInS, false);
    x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
    x.send()
    return x.response
}

// Initial Python script to set up stout, stderr and input redirect
const initPyCode = `
import sys
import js
import ast
import traceback
import copy
import time
from collections import deque
from pyodide import to_js

print(sys.version)
class DebugOutput:
    def write(self, text):
        #js.console.log(text.strip())
        js.workerPrint(text);

class TestOutput:
    def __init__(self):
        self.buffer = ""

    def clear(self):
        self.buffer = ""

    def write(self, text):
        self.buffer += text

debug_output = DebugOutput()
test_output = TestOutput()

global_vars = {}
active_breakpoints = set()
test_inputs = []
test_outputs = []
step_into = False

def pyexec(code, expected_input, expected_output):
    global test_inputs
    global test_outputs
    global global_vars
    global_vars = {'hit_breakpoint': hit_breakpoint, 'traceback': traceback, 'input': test_input}

    sys.stdout = test_output
    sys.stderr = test_output
    time.sleep = test_sleep
    input = test_input

    test_inputs = expected_input.split("\\n") if expected_input else []
    test_outputs = expected_output

    test_output.clear()
    parsed_stmts = ast.parse(code)
    try:
        exec(compile(parsed_stmts, filename="YourPythonCode.py", mode="exec"), global_vars)
    except Exception as e:
        return js.Object.fromEntries(to_js({"err": "Runtime error", "ins": expected_input}))

    if len(test_inputs) == 1 and test_inputs[0] == '':
        test_inputs = []  # if we have one last blank input stuck in the queue, just ignore it 

    if test_outputs != test_output.buffer:
        js.console.log(str(test_outputs), "!=", str(test_output.buffer))
        return js.Object.fromEntries(to_js({"err": "Incorrect output", "expected": str(test_outputs), "actual": str(test_output.buffer), "ins": expected_input}))
    elif len(test_inputs) > 0:
        js.console.log("inputs unconsumed: " + str(test_inputs))
        return js.Object.fromEntries(to_js({"err": "Unconsumed input", "ins": expected_input}))
    else:
        return True

def pydebug_old(code, breakpoints):
    global global_vars
    global active_breakpoints
    global_vars = {'hit_breakpoint': hit_breakpoint, 'traceback': traceback, 'input': debug_input, 'time.sleep': debug_sleep}
    sys.stdout = debug_output
    sys.stderr = debug_output
    time.sleep = debug_sleep
    input = debug_input

    parsed_stmts = ast.parse(code)
    parsed_break = ast.parse("hit_breakpoint(99, locals(), globals())")
    breakpoints = set(breakpoints)
    active_breakpoints = set(breakpoints)

    # walk the AST and inject breakpoint commands where neeeded
    workqueue = deque()  # stores (node, idx_in_parent, parent). The latter two are needed for instrumentation
    workqueue.extend([(parsed_stmts.body[i], i, parsed_stmts) for i in range(len(parsed_stmts.body))])
    while workqueue and breakpoints:
        node, i, parent = workqueue.popleft()
        if node.lineno in breakpoints:
            break_cmd = copy.deepcopy(parsed_break.body[0])
            break_cmd.value.lineno = node.lineno
            break_cmd.value.end_lineno = node.lineno
            break_cmd.value.args[0] = ast.Constant(node.lineno, lineno=0, col_offset=0)
            parent.body.insert(i, break_cmd)
            i += 1
            breakpoints.remove(node.lineno)
        if hasattr(node, 'body'):
            workqueue.extend([(node.body[i], i, node) for i in range(len(node.body))])

    exec(compile(parsed_stmts, filename="YourPythonCode.py", mode="exec"), global_vars)


def pydebug(code, breakpoints):
    global global_vars
    global active_breakpoints
    global_vars = {'hit_breakpoint': hit_breakpoint, 'traceback': traceback, 'input': debug_input, 'time.sleep': debug_sleep}
    sys.stdout = debug_output
    sys.stderr = debug_output
    time.sleep = debug_sleep
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

def prepare_step():
    global step_into
    step_into = True

# input functions
def debug_input(prompt = ""):
    if prompt: 
        print(prompt)
    return js.workerInput()

def test_input(prompt = ""):
    if prompt: 
        print(prompt)
    return test_inputs.pop(0)

# redefine sleep to block
def debug_sleep(time_in_s):
    return js.workerSleep(time_in_s)

def test_sleep(time_in_s):
    pass

def hit_breakpoint(lineno, alocals, aglobals):
    global step_into
    if step_into or lineno in active_breakpoints:
        step_into = False
        #js.console.log("breaking on", lineno)
        stack = traceback.extract_stack()[1:-1]  # remove wrapper and breakpt method
        VARS_TO_REMOVE = ["__name__", "__main__", "__package__", "__annotations__", "__doc__", 
            "__loader__", "__spec__", "__builtins__", "sys", "js", "ast", "MyOutput", "my_output",
            "pydebug", "input", "hit_breakpoint", "VARS_TO_REMOVE", "traceback", "sleep"]
        vars = aglobals.copy()
        vars.update(alocals)
        env = { k:str(vars[k]) for k in vars if k not in VARS_TO_REMOVE and not callable(vars[k])}
        js.workerBreakpoint(lineno, env)
`
