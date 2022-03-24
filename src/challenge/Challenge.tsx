import {Box, Card, CardContent} from '@mui/material'
import DebugPane from './DebugPane'
import PyEditor from './PyEditor'
import Console from './Console'
import Guide from './Guide'
import MainControls from './MainControls'
import { Allotment } from "allotment"
import "allotment/dist/style.css"
import React from 'react'
import Cookies from 'js-cookie'
import ChallengeStatus from './context/ChallengeStatus'
import {TestResults} from './context/TestResult'
import DebugContext  from './context/DebugContext'



type TestCase = {
    in: string,
    out: string
}

type TestData = {
    code?: string,
    tests?: TestCase[]
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

type WorkerResponse = {
    cmd: string
}

type ChallengeState = {
    starterCode: string | null,
    savedCode: string | null,
    worker: Worker | null,
    guideMd: string,
    debugContext: DebugContext,
    theme: string,
    editorFullScreen: boolean,
    errorLoading: boolean,
    consoleText: string,
    awaitingInput: boolean,
    editorState: ChallengeStatus,
    testResults: TestResults,
    breakpointsChanged: boolean,
    testsPassing: boolean | null,
    interruptBuffer: Uint8Array | null,
}

type ChallengeProps = {
    uid: string | null,
    guidePath: string,
    codePath: string,
    hasBook: boolean,
    layout: string,
    tests: TestCase[],
    onTestsPassingChanged: (passing: boolean | null) => void,
    openBookDrawer: (open: boolean) => void,
}

const controller = {
    "init-done": (comp: Challenge) =>  comp.setState({editorState: ChallengeStatus.READY}),
    "print": (comp: Challenge, data: PrintData) => comp.setState((state: ChallengeState) => {return {consoleText: state.consoleText + data.msg}}),
    "cls": (comp: Challenge) => comp.setState({consoleText: ""}),
    "input": (comp: Challenge) => comp.setState({awaitingInput: true, editorState: ChallengeStatus.AWAITING_INPUT}),
    "input-entered": (comp: Challenge, data: InputData) => {
        var x = new XMLHttpRequest();
        x.open('post', '/@input@/resp.js');
        x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
        let input = data?.input == null ? "" : data.input
        try { x.send(JSON.stringify({"data": input, "breakpoints": comp.state.breakpointsChanged && comp.editorRef.current ? comp.editorRef.current.getBreakpoints() : null})) } catch(e) {console.log(e)}
        comp.setState((state: ChallengeState) => { return {consoleText: state.consoleText + data.input + "\n", awaitingInput: false}})
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
        controller['continue'](comp, {step: true})
    },
    "debug-finished": (comp: Challenge, data: DebugFinishedData) => {
        let msg = {
            "ok": "Program finished ok. Press debug to run again...",
            "error": "Interrupted by error. Check the error message, then press debug to run again..."
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
        worker.addEventListener("message", (msg: MessageEvent<WorkerResponse>) => controller[msg.data.cmd](comp, msg.data));
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
        controller["save-code"](comp, {code: data.code})
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
        controller["save-code"](comp, {code: data.code})
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
    }
}



class Challenge extends React.Component<ChallengeProps, ChallengeState> {

    editorRef = React.createRef<PyEditor>();

    state: ChallengeState = {
        starterCode: null, 
        savedCode: null,
        worker: null, 
        consoleText: "Press debug to get started...", 
        guideMd: "*Loading the guide... Please wait*",
        debugContext: {lineno: 0, env: new Map()},
        editorState: ChallengeStatus.LOADING,
        theme: "vs-dark",
        editorFullScreen: false,
        errorLoading: false,
        testResults: [],
        breakpointsChanged: false,
        testsPassing: null,
        interruptBuffer: null,
        awaitingInput: false,
    };

    constructor(props: ChallengeProps) {
        super(props);
        this.handleThemeChange.bind(this);
        this.getVisibilityWithHack.bind(this);
        this.onBreakpointsUpdated.bind(this);
    };

    componentDidMount() {
        console.log("crossOriginIsolated", window.crossOriginIsolated)
        let previousTheme = Cookies.get("theme")
        if (previousTheme) {
            this.setState({theme: previousTheme})
        }
        if (this.props?.uid) {
            let savedCode = localStorage.getItem("code-" + encodeURIComponent(this.props.uid))
            if (savedCode) {
                this.setState({savedCode: savedCode})
            }
        }
        fetch(this.props.guidePath)
            .then(response => {if (!response.ok) {this.setState({errorLoading: true})} return response.text()})
            .then(text => this.setState({guideMd: text}))
        fetch(this.props.codePath)
            .then(response => {if (!response.ok) {this.setState({errorLoading: true})} return response.text()})
            .then(text => this.setState({starterCode: text}))

        navigator.serviceWorker.register('pysw.js').then(function(reg) {
            if (navigator.serviceWorker.controller === null || !reg.active) {
                window.location.reload();
            }
        });
        controller["restart-worker"](this, {force: true})
    }

    componentDidUpdate(prevProps: ChallengeProps, prevState: ChallengeState) {
        if (prevProps.guidePath !== this.props.guidePath) {
            fetch(this.props.guidePath)
                .then(response => response.text())
                .then(text => this.setState({guideMd: text}))
            fetch(this.props.codePath)
                .then(response => response.text())
                .then(text => this.setState({starterCode: text}))
            controller["restart-worker"](this, {})
            if (this.props?.uid) {
                let savedCode = localStorage.getItem("code-" + encodeURIComponent(this.props.uid))
                if (savedCode) {
                    this.setState({savedCode: savedCode})
                } else {
                    this.setState({savedCode: null})
                }
            } else {
                this.setState({savedCode: null})
            }
            this.setState({testResults: [], testsPassing: null})
        }
        if (this.editorRef.current && this.state.editorState !== prevState.editorState &&
            (prevState.editorState === ChallengeStatus.ON_BREAKPOINT ||
            this.state.editorState === ChallengeStatus.ON_BREAKPOINT))  {
                this.editorRef.current.updateEditorDecorations()
            }

        if (this.state.testResults !== prevState.testResults) {
            let newTestResult = this.state.testResults.length === 0 ? null :
                this.state.testResults.filter(x => x.outcome !== true).length === 0
            this.setState({testsPassing: newTestResult});
        }

        if (this.state.testsPassing !== prevState.testsPassing) {
            if (this.props.onTestsPassingChanged) {
                this.props.onTestsPassingChanged(this.state.testsPassing)
            }
        }
    }

    handleThemeChange = (theme: string) => {
        this.setState({theme})
        Cookies.set("theme", theme)
    }

    getVisibilityWithHack = (visible: boolean) => {
        // allotment seems to dislike visibility=true during load time
        return this.state.editorState === ChallengeStatus.LOADING ? undefined : visible;
    }

    onBreakpointsUpdated = () => {
        if (this.editorRef.current && this.state.editorState !== ChallengeStatus.READY) {
            this.setState({breakpointsChanged: true})
        }
    }
    
    renderEditor() {
        return (<PyEditor ref={this.editorRef} 
            canRun={this.state.editorState === ChallengeStatus.READY}
            canPlaceBreakpoint={this.state.editorState === ChallengeStatus.READY || this.state.editorState === ChallengeStatus.AWAITING_INPUT || this.state.editorState === ChallengeStatus.ON_BREAKPOINT}
            isOnBreakPoint={this.state.editorState === ChallengeStatus.ON_BREAKPOINT}
            onBreakpointsUpdated={this.onBreakpointsUpdated}
            debugContext={this.state.debugContext}
            starterCode={this.state.savedCode ? this.state.savedCode : this.state.starterCode ? this.state.starterCode : ""}
            theme={this.state.theme}
            onToggleFullScreen={() => {this.setState((state, props) => { return {editorFullScreen: !state.editorFullScreen} })}}
            onDebug={() => {controller["debug"](this, {code: this.editorRef.current?.getValue(), breakpoints: this.editorRef.current ? this.editorRef.current.getBreakpoints() : []})}}
            onContinue={() => controller["continue"](this, {})}
            onStepInto={() => controller["step"](this)}
            onStop={() => { controller["restart-worker"](this, {msg: "Interrupted...", force: true})}}
            />)
    }

    renderConsole = () => {
        return (<Console 
            content={this.state.consoleText} 
            isInputEnabled={this.state.editorState === ChallengeStatus.AWAITING_INPUT} 
            onInput={(input) => {controller["input-entered"](this, {input})}}
            onInterrupt={() => { controller["restart-worker"](this, {msg: "Interrupted...", force: true})}}/>)
    }

    renderMainControls = () => {
        return (
            <Card sx={{overflow: "visible"}}>
                <CardContent>
                    <MainControls
                        theme={this.state.theme}
                        onThemeChange={this.handleThemeChange}
                        onDebug={() => { controller["debug"](this, {code: this.editorRef.current?.getValue(), breakpoints: this.editorRef.current ? this.editorRef.current.getBreakpoints() : []})}}
                        onSubmit={() => { controller["test"](this, {code: this.editorRef.current?.getValue(), tests: this.props.tests})}}
                        onResetCode={() => controller["reset-code"](this)}
                        canDebug={this.state.editorState === ChallengeStatus.READY}
                        canReset={this.state.editorState === ChallengeStatus.READY}
                        canSubmit={this.props.tests !== null}
                        hasBook={this.props.hasBook}
                        testResults={this.state.testResults}
                        openBookDrawer={this.props.openBookDrawer}
                    />
                </CardContent>
            </Card>
        )
    }

    renderGuide = () => {
        return <Guide md={this.state.guideMd}/>
    }

    renderDebugPane = () => {
        return (<DebugPane 
            canContinue={this.state.editorState === ChallengeStatus.ON_BREAKPOINT}
            onContinue={() => controller["continue"](this, {})}
            onStep={() => controller["step"](this)}
            canKill={this.state.editorState === ChallengeStatus.RUNNING || 
                    this.state.editorState === ChallengeStatus.ON_BREAKPOINT ||
                    this.state.editorState === ChallengeStatus.AWAITING_INPUT}
            onKill={() => { controller["restart-worker"](this, {msg: "Interrupted...", force: true})}}
            debugContext={this.state.debugContext}/>)
    }

    render() {
        if (this.state.errorLoading) {
            return (<p>The challenges files cannot be found. Have they been moved?</p>)
        }
        else if (this.props.layout === "fullscreen") {
            return (       
                <Box sx={{width: "100%", height: "100%"}}>
                    <Allotment className="h-100" defaultSizes={[65, 35]}>
                        <Allotment.Pane>
                            <Allotment vertical>
                                <Allotment.Pane>
                                    {this.renderEditor()}
                                </Allotment.Pane>
                                <Allotment.Pane visible={this.getVisibilityWithHack(!this.state.editorFullScreen)} maxSize={350} minSize={150}>
                                    {this.renderConsole()}
                                </Allotment.Pane>
                            </Allotment>
                        </Allotment.Pane>
                        <Allotment.Pane visible={this.getVisibilityWithHack(!this.state.editorFullScreen)}>
                            <Allotment vertical >
                                <Box sx={{ p:2, display: "flex", flexDirection: "column", height: "100%"}}>
                                    {this.renderMainControls()}
                                    {this.renderGuide()}
                                </Box>
                                <Allotment.Pane maxSize={350} minSize={150} snap={true} 
                                    visible={this.state.editorState === ChallengeStatus.RUNNING || 
                                        this.state.editorState === ChallengeStatus.ON_BREAKPOINT ||
                                        this.state.editorState === ChallengeStatus.AWAITING_INPUT}>
                                    {this.renderDebugPane()}
                                </Allotment.Pane>
                            </Allotment>
                        </Allotment.Pane>
                    </Allotment>
                </Box> 
            )
        } else {
            return (
                <Box sx={{width: "100%", height: "100%"}}>
                    <Box sx={{ p:2}}>
                        {this.renderGuide()}
                    </Box>
                    <Box sx={{height: "600px"}}>
                        {this.renderEditor()}
                    </Box>
                    {this.renderMainControls()}
                    <Box sx={{maxHeight: "400px", overflowY: "auto"}}>
                        {this.renderConsole()}
                        </Box>
                    <Box sx={{maxHeight: "200px", overflowY: "auto"}}>
                        {this.renderDebugPane()}
                    </Box>
                </Box>
            )
        }   
    }
}

export default Challenge