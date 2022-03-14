import {Box, Card, CardContent} from '@mui/material'
import DebugPane from './DebugPane'
import PyEditor from './PyEditor'
import Console from './Console'
import MainControls from './MainControls'
import ReactMarkdown from 'react-markdown'
import { Allotment } from "allotment"
import "allotment/dist/style.css"
import React from 'react'
import Cookies from 'js-cookie'
import {READY, AWAITING_INPUT, LOADING, ON_BREAKPOINT, RESTARTING_WORKER, RUNNING} from './ChallengeState'


import "./Challenge.css";

const controller = {
    "init-done": (comp, data) =>  comp.setState({editorState: READY}),
    "print": (comp, data) => comp.setState((state, props) => {return {consoleText: state.consoleText + data.msg}}),
    "input": (comp, data) => comp.setState({awaitingInput: true, editorState: AWAITING_INPUT}),
    "input-entered": (comp, data) => {
        var x = new XMLHttpRequest();
        x.open('post', '/@input@/resp.js');
        x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
        let input = data?.input == null ? "" : data.input
        try { x.send(JSON.stringify({"data": input, "breakpoints": comp.state.breakpointsChanged ? comp.editorRef.current.getBreakpoints() : null})) } catch(e) {console.log(e)}
        comp.setState((state, props) => { return {consoleText: state.consoleText + data.input + "\n", awaitingInput: false}})
    },
    "continue": (comp, data) => {
        var x = new XMLHttpRequest();
        x.open('post', '/@debug@/continue.js');
        x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
        try { x.send(JSON.stringify({"data": "", "breakpoints": comp.state.breakpointsChanged ? comp.editorRef.current.getBreakpoints() : null})) } catch(e) {console.log(e)}
        comp.setState({editorState: RUNNING})
    },
    "step": (comp, data) => {
        var x = new XMLHttpRequest();
        x.open('post', '/@debug@/continue.js');
        x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
        let breakpointsUpdated = comp.state.breakpointsChanged
        let breakpoints = comp.editorRef.current.getBreakpoints()
        let lineNo = comp.state.debugInfo.lineno + 1;
        if (!breakpoints.includes(lineNo)) {
            breakpoints = [...breakpoints]
            breakpoints.push(lineNo)
            breakpointsUpdated = true
        }
        try { x.send(JSON.stringify({"data": "", "breakpoints": breakpointsUpdated ? breakpoints : null})) } catch(e) {console.log(e)}
        comp.setState({editorState: RUNNING})
    },
    "debug-finished": (comp, data) => {
        let msg = {
            "ok": "Program finished ok. Press debug to run again...",
            "error": "Interrupted by error. Check the error message, then press debug to run again..."
        }[data.reason]
        comp.setState((state, props) => {return {consoleText: state.consoleText + "\n" + msg + "\n", editorState: READY}}) 
    },
    "test-finished": (comp, data) => {
        comp.setState((state, props) => {return {testResults: data.results, editorState: READY}}) 
    },
    "restart-worker": (comp, data) => {
        if (comp.state.editorState === RESTARTING_WORKER) {
            return;
        }
        if (comp.state.worker) {
            comp.state.worker.terminate()
        }
        let worker = new window.Worker('pyworker_sw.js');
        worker.addEventListener("message", (msg) => controller[msg.data.cmd](comp, msg.data));
        let msg = data?.msg == null ? "" : data.msg
        comp.setState((state, props) => {return {consoleText: state.consoleText + msg, worker: worker, editorState: RESTARTING_WORKER}})
    },
    "debug": (comp, data) => {
        if (comp.state.editorState === READY) {
            comp.state.worker.postMessage({cmd: "debug", code: data.code, breakpoints: data.breakpoints}); 
            comp.setState({consoleText: "", editorState:RUNNING, breakpointsChanged: false})
        }
    },
    "test": (comp, data) => {
        if (comp.state.editorState === READY) {
            comp.state.worker.postMessage({cmd: "test", code: data.code, tests: data.tests}); 
            comp.setState({consoleText: "", editorState:RUNNING})
        }
    },
    "reset-code": (comp, data) => comp.editorRef.current.setValue(comp.state.starterCode),
    "breakpt": (comp, data) => comp.setState({debugInfo: {lineno: data.lineno, env: new Map([...data.env.entries()].sort())}, editorState: ON_BREAKPOINT})
}



class Challenge extends React.Component {

    state = {
        starterCode: null, 
        worker: null, 
        consoleText: "Press debug to get started...", 
        guideMd: "*Loading the guide... Please wait*",
        debugInfo: {lineno: 0, env: new Map()},
        editorState: LOADING,
        theme: "vs-dark",
        editorFullScreen: false,
        errorLoading: false,
        testResults: [],
        breakpointsChanged: false
    };

    constructor(props) {
        super(props);
        this.editorRef = React.createRef();
        this.handleThemeChange.bind(this);
        this.getVisibilityWithHack.bind(this);
        this.onBreakpointsUpdated.bind(this);
    };

    componentDidMount() {
        let previousTheme = Cookies.get("theme")
        if (previousTheme) {
            this.setState({theme: previousTheme})
        }
        fetch(this.props.guidePath)
            .then(response => {if (!response.ok) {this.setState({errorLoading: true})} return response.text()})
            .then(text => this.setState({guideMd: text}))
        fetch(this.props.codePath)
            .then(response => {if (!response.ok) {this.setState({errorLoading: true})} return response.text()})
            .then(text => this.setState({starterCode: text}))

        navigator.serviceWorker.register('/pysw.js').then(function(reg) {
            if (navigator.serviceWorker.controller === null || !reg.active) {
                window.location.reload();
            }
        });
        controller["restart-worker"](this)
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.guidePath !== this.props.guidePath) {
            fetch(this.props.guidePath)
                .then(response => response.text())
                .then(text => this.setState({guideMd: text}))
            fetch(this.props.codePath)
                .then(response => response.text())
                .then(text => this.setState({starterCode: text}))
            controller["restart-worker"](this)
        }
        if (this.state.editorState !== prevState.editorState &&
            (prevState.editorState === ON_BREAKPOINT ||
            this.state.editorState === ON_BREAKPOINT))  {
                this.editorRef.current.updateEditorDecorations()
            }
    }

    handleThemeChange = (event) => {
        this.setState({theme: event.target.value})
        Cookies.set("theme", event.target.value)
    }

    getVisibilityWithHack = (visible) => {
        // allotment seems to dislike visibility=true during load time
        return this.state.editorState === LOADING ? undefined : visible;
    }

    onBreakpointsUpdated = () => {
        if (this.editorRef.state !== READY) {
            this.setState({breakpointsChanged: true})
        }
    }
    
    renderEditor() {
        return (<PyEditor ref={this.editorRef} 
            canPlaceBreakpoint={this.state.editorState === READY || this.state.editorState === AWAITING_INPUT || this.state.editorState === ON_BREAKPOINT}
            isOnBreakPoint={this.state.editorState === ON_BREAKPOINT}
            onBreakpointsUpdated={this.onBreakpointsUpdated}
            debugInfo={this.state.debugInfo}
            starterCode={this.state.starterCode}
            theme={this.state.theme}
            onToggleFullScreen={() => {this.setState((state, props) => { return {editorFullScreen: !state.editorFullScreen} })}}
            onDebug={() => {controller["debug"](this, {code: this.editorRef.current.getValue(), breakpoints: this.editorRef.current.getBreakpoints()})}}
            oSubmit={() => {controller["run"](this, {code: this.editorRef.current.getValue(), breakpoints: this.editorRef.current.getBreakpoints()})}}
            />)
    }

    renderConsole() {
        return (<Console 
            content={this.state.consoleText} 
            isInputEnabled={this.state.editorState === AWAITING_INPUT} 
            onInput={(input) => {controller["input-entered"](this, {input})}}
            onInterrupt={() => { controller["restart-worker"](this, {msg: "Interrupted..."})}}>
        </Console>)
    }

    renderMainControls() {
        return (
            <Card>
                <CardContent>
                    <MainControls
                        theme={this.state.theme}
                        onThemeChange={this.handleThemeChange}
                        onDebug={() => { controller["debug"](this, {code: this.editorRef.current.getValue(), breakpoints: this.editorRef.current.getBreakpoints()})}}
                        onSubmit={() => { controller["test"](this, {code: this.editorRef.current.getValue(), tests: this.props.tests})}}
                        onResetCode={() => controller["reset-code"](this)}
                        canDebug={this.state.editorState === READY}
                        canReset={this.state.editorState === READY}
                        canSubmit={this.props.tests !== null}
                        hasBook={this.props.hasBook}
                        testResults={this.state.testResults}
                        toggleBookDrawer={this.props.toggleBookDrawer}
                    />
                </CardContent>
            </Card>
        )
    }

    renderGuide() {
        return (<ReactMarkdown>{this.state.guideMd}</ReactMarkdown>)
    }

    renderDebugPane() {
        return (<DebugPane 
            canContinue={this.state.editorState === ON_BREAKPOINT}
            onContinue={() => controller["continue"](this)}
            onStep={() => controller["step"](this)}
            canKill={this.state.editorState === RUNNING || 
                    this.state.editorState === ON_BREAKPOINT ||
                    this.state.editorState === AWAITING_INPUT}
            onKill={() => { controller["restart-worker"](this, {msg: "Interrupted..."})}}
            debugInfo={this.state.debugInfo}/>)
    }

    render() {
        if (this.state.errorLoading) {
            return (<p>The challenges files cannot be found. Have they been moved?</p>)
        }
        else if (this.props.layout === "fullscreen") {
            return (       
                <Box sx={{width: "100%", height: "100%"}}>
                    <Allotment className="h-100">
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
                                <Box sx={{ p:2, overflowY: "auto"}}>
                                    {this.renderMainControls()}
                                    {this.renderGuide()}
                                </Box>
                                <Allotment.Pane maxSize={350} minSize={150} snap={true} 
                                    visible={this.state.editorState === RUNNING || 
                                        this.state.editorState === ON_BREAKPOINT ||
                                        this.state.editorState === AWAITING_INPUT}>
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