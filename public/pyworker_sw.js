importScripts("https://cdn.jsdelivr.net/pyodide/v0.19.1/full/pyodide.js");

// communication with the main site
// there are two commands implemented at the moment:
//   run(code) which runs a piece of code
//   input(data) which provides the input from the user to a currently blocked code
// the assumption is that run will not be called while there is an active Python code running
// also, there is an assumption that there cannot be two synchronouse inputs
onmessage = function(e) {
    if (e.data.cmd === "run") {
        let reason = "ok"
        try {
            self.pyodide.globals.get("pyexec")(e.data.code, e.data.breakpoints)
        }  
        catch (err) {
            workerPrint(err);
            reason = "error"
        }
        self.postMessage({"cmd": "debug-finished", reason});
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
    return x.response
} 

workerBreakpoint = (lineno, env) => {
    env = env.toJs();
    self.postMessage({cmd: "breakpt", lineno, env})
    var x = new XMLHttpRequest();
    x.open('get', '/@input@/req.js', false);
    x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
    x.send()
    return
}

// Initial Python script to set up stout, stderr and input redirect
const initPyCode = `
import sys
import js
import ast
import traceback
import copy
from collections import deque

print(sys.version)
class MyOutput:
    def write(self, text):
        js.console.log(text.strip())
        js.workerPrint(text);

my_output = MyOutput()
sys.stdout = my_output
sys.stderr = my_output

global_vars = {}

def pyexec(code, breakpoints):
    global global_vars
    global_vars = {'hit_breakpoint': hit_breakpoint, 'traceback': traceback, 'input':input}

    parsed_stmts = ast.parse(code)
    parsed_break = ast.parse("hit_breakpoint(99, locals(), globals())")
    breakpoints = set(breakpoints)

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

# redefine input function
def input(prompt = ""):
    if prompt: 
        print(prompt)
    return js.workerInput()

def hit_breakpoint(lineno, alocals, aglobals):
    stack = traceback.extract_stack()[1:-1]  # remove wrapper and breakpt method
    VARS_TO_REMOVE = ["__name__", "__main__", "__package__", "__annotations__", "__doc__", 
        "__loader__", "__spec__", "__builtins__", "sys", "js", "ast", "MyOutput", "my_output",
        "pyexec", "input", "hit_breakpoint", "VARS_TO_REMOVE", "traceback"]
    vars = aglobals.copy()
    vars.update(alocals)
    env = { k:str(vars[k]) for k in vars if k not in VARS_TO_REMOVE and not callable(vars[k])}
    # print(env)
    # print(stack)
    js.workerBreakpoint(lineno, env)
`
