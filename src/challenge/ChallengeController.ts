import Challenge, {ChallengeState} from './Challenge'
import ChallengeStatus from '../models/ChallengeStatus'
import {TestCases, TestResults} from '../models/Tests'
import DebugContext  from '../models/DebugContext'

type TestData = {
    code?: string,
    tests?: TestCases | null,
}

type PrintData = {
    msg: string
}

type InputData = {
    input: string | null
}

type ContinueData = {
    step?: boolean | null
}

type DebugFinishedData = {
    reason: number
}

type TestFinishedData = {
    results: TestResults
}

type RestartWorkerData = {
    force?: boolean | null,
    msg?: string | null
}

type DebugData = {
    code?: string | null,
    breakpoints: number[]
}

type SaveCodeData = {
    code: string | null
}

const ChallengeController = {
    "init-done": (comp: Challenge) =>  comp.setState({editorState: ChallengeStatus.READY}),
    "print": (comp: Challenge, data: PrintData) => comp.setState((state: ChallengeState) => {return {consoleText: state.consoleText + data.msg}}),
    "cls": (comp: Challenge) => comp.setState({consoleText: ""}),
    "input": (comp: Challenge) => comp.setState({editorState: ChallengeStatus.AWAITING_INPUT}),
    "input-entered": (comp: Challenge, data: InputData) => {
        var x = new XMLHttpRequest();
        x.open('post', '/@input@/resp.js');
        x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
        let input = data?.input == null ? "" : data.input
        try { x.send(JSON.stringify({"data": input, "breakpoints": comp.state.breakpointsChanged && comp.editorRef.current ? comp.editorRef.current.getBreakpoints() : null})) } catch(e) {console.log(e)}
        comp.setState((state: ChallengeState) => { return {consoleText: state.consoleText + data.input + "\n", editorState: ChallengeStatus.RUNNING}})
    },
    "continue": (comp: Challenge, data: ContinueData) => {
        var x = new XMLHttpRequest();
        x.open('post', '/@debug@/continue.js');
        x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
        try { x.send(JSON.stringify({"breakpoints": comp.state.breakpointsChanged && comp.editorRef.current ? comp.editorRef.current.getBreakpoints() : null, "step": data?.step ? data.step : false})) } catch(e) {console.log(e)}
        comp.setState({editorState: ChallengeStatus.RUNNING})
    },
    "step": (comp: Challenge) => {
        ChallengeController['continue'](comp, {step: true})
    },
    "debug-finished": (comp: Challenge, data: DebugFinishedData) => {
        let msg = {
            "ok": "Program finished ok. Press debug to run again...",
            "error": "Interrupted by error. Check the error message, then press debug to run again...",
            "interrupt": "Interrupted..."
        }[data.reason]
        comp.setState((state: ChallengeState) => {return {consoleText: state.consoleText + "\n" + msg + "\n", editorState: ChallengeStatus.READY}}) 
    },
    "test-finished": (comp: Challenge, data: TestFinishedData) => {
        comp.setState({testResults: data.results, editorState: ChallengeStatus.READY}) 
    },
    "restart-worker": (comp: Challenge, data: RestartWorkerData) => {
        if (comp.state.editorState === ChallengeStatus.RESTARTING_WORKER) {
            return; // already resetting
        }
        if (comp.state.editorState === ChallengeStatus.READY && !data?.force) {
            return; // in ready state already
        }
        if (comp.state.worker && comp.state.interruptBuffer) {
            comp.state.interruptBuffer[0] = 2;
            var x = new XMLHttpRequest();
            x.open('post', '/@reset@/reset.js');
            x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
            try { x.send("") } catch(e) {console.log(e)}
            return; // we can just issue an interrupt, no need to kill worker
        }
        if (comp.state.worker) {
            comp.state.worker.terminate()
        }
        let worker = new Worker('/static/js/pyworker_sw.js');
        // @ts-ignore  dybamic dispatch from worker
        worker.addEventListener("message", (msg: MessageEvent<WorkerResponse>) => ChallengeController[msg.data.cmd](comp, msg.data));
        let interruptBuffer: Uint8Array | null = null;
        if (window.crossOriginIsolated && window.SharedArrayBuffer) {
            interruptBuffer = new Uint8Array(new window.SharedArrayBuffer(1));
            worker.postMessage({ cmd: "setInterruptBuffer", interruptBuffer });
        }
        let msg = data.msg == null ? "" : data.msg
        comp.setState((state: ChallengeState) => {return {consoleText: state.consoleText + msg, worker: worker, editorState: ChallengeStatus.RESTARTING_WORKER, interruptBuffer}})
    },
    "debug": (comp: Challenge, data: DebugData) => {
        if (!data.code) {
            return;
        }
        if (comp.state.editorState === ChallengeStatus.READY) {
            if (comp.state.interruptBuffer) {
                comp.state.interruptBuffer[0] = 0; // if interrupts are supported, just clear the flag for this execution
            }
            comp.state.worker?.postMessage({cmd: "debug", code: data.code, breakpoints: data.breakpoints}); 
            comp.setState({consoleText: "", editorState: ChallengeStatus.RUNNING, breakpointsChanged: false})
        }
        ChallengeController["save-code"](comp, {code: data.code})
    },
    "test": (comp: Challenge, data: TestData) => {
        if (!comp.state.worker || !data.tests || !data.code) {
            return;
        }
        if (comp.state.editorState === ChallengeStatus.READY) {
            if (comp.state.interruptBuffer) {
                comp.state.interruptBuffer[0] = 0; // if interrupts are supported, just clear the flag for this execution
            }
            comp.state.worker.postMessage({cmd: "test", code: data.code, tests: data.tests}); 
            comp.setState({consoleText: "", editorState:ChallengeStatus.RUNNING})
        }
        ChallengeController["save-code"](comp, {code: data.code})
    },
    "reset-code": (comp: Challenge) => {if (comp.state.starterCode && comp.editorRef.current) { comp.editorRef.current.setValue(comp.state.starterCode)}},
    "breakpt": (comp: Challenge, data: DebugContext) => {
        comp.setState({debugContext: {lineno: data.lineno, env: new Map([...data.env.entries()].sort())}, editorState: ChallengeStatus.ON_BREAKPOINT})
        comp.editorRef.current?.revealLine(data.lineno)
    },
    "save-code": (comp: Challenge, data: SaveCodeData) => {
        if (data.code && comp.props.uid) {
            localStorage.setItem("code-" + encodeURIComponent(comp.props.uid), data.code)
        }
    },
}

export default ChallengeController;
