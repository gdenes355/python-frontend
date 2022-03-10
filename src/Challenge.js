import {Box, Card, CardContent} from '@mui/material'
import DebugPane from './components/DebugPane'
import PyEditor from './components/PyEditor'
import Console from './components/Console'
import MainControls from './components/MainControls'
import ReactMarkdown from 'react-markdown'
import { Allotment } from "allotment"
import "allotment/dist/style.css"
import React from 'react'
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
        try { x.send(JSON.stringify({"data": input})) } catch(e) {}
        comp.setState((state, props) => { return {consoleText: state.consoleText + data.input + "\n", awaitingInput: false}})
    },
    "continue": (comp, data) => {
        var x = new XMLHttpRequest();
        x.open('post', '/@input@/resp.js');
        x.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        x.setRequestHeader('cache-control', 'no-cache, no-store, max-age=0');
        let input = data?.input == null ? "" : data.input
        try { x.send(JSON.stringify({"data": input})) } catch(e) {}
        comp.setState({editorState: RUNNING})
    },
    "debug-finished": (comp, data) => {
        let msg = {
            "ok": "Program finished ok. Press debug to run again...",
            "error": "Interrupted by error. Check the error message, then press debug to run again..."
        }[data.reason]
        comp.setState((state, props) => {return {consoleText: state.consoleText + "\n" + msg + "\n", editorState: READY}}) 
    },
    "restart-worker": (comp, data) => {
        if (comp.state === LOADING) {
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
    "run": (comp, data) => {
        if (comp.state.editorState === READY) {
            comp.state.worker.postMessage({cmd: "run", code: data.code, breakpoints: data.breakpoints}); 
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
        editorFullScreen: false
    };

    constructor(props) {
        super(props);
        this.editorRef = React.createRef();
        this.handleThemeChange.bind(this);
        this.getVisibilityWithHach.bind(this);
    };

    componentDidMount() {
        fetch(this.props.guidePath)
            .then(response => response.text())
            .then(text => this.setState({guideMd: text}))
        fetch(this.props.codePath)
            .then(response => response.text())
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
    }

    getVisibilityWithHach = (visible) => {
        // allotment seems to dislike visibility=true during load time
        return this.state.editorState === LOADING ? undefined : visible;
    }

    render() {
        return (       
            <Box sx={{width: "100%", height: "100%"}}>
            <Allotment minSize={100} split="vertical" className="h-100">
                <Allotment.Pane>
                    <Allotment vertical>
                        <Allotment.Pane>
                            <PyEditor ref={this.editorRef} 
                                canPlaceBreakpoint={this.state.editorState === READY}
                                isOnBreakPoint={this.state.editorState === ON_BREAKPOINT}
                                debugInfo={this.state.debugInfo}
                                starterCode={this.state.starterCode}
                                theme={this.state.theme}
                                onToggleFullScreen={() => {this.setState((state, props) => { return {editorFullScreen: !state.editorFullScreen} })}}
                                onDebug={() => {controller["run"](this, {code: this.editorRef.current.getValue(), breakpoints: this.editorRef.current.getBreakpoints()})}}
                                />
                        </Allotment.Pane>
                        <Allotment.Pane visible={this.getVisibilityWithHach(!this.state.editorFullScreen)} maxSize={350} minSize={150}>
                            <Console 
                                content={this.state.consoleText} 
                                isInputEnabled={this.state.editorState === AWAITING_INPUT} 
                                onInput={(input) => {controller["input-entered"](this, {input})}}
                                onInterrupt={() => { controller["restart-worker"](this, {msg: "Interrupted..."})}}>
                                </Console>
                        </Allotment.Pane>
                    </Allotment>
                </Allotment.Pane>
                <Allotment.Pane visible={this.getVisibilityWithHach(!this.state.editorFullScreen)}>
                    <Allotment vertical >
                        <Box sx={{ p:2, overflowY: "auto"}}>
                            <Card>
                                <CardContent>
                                    <MainControls
                                        theme={this.state.theme}
                                        onThemeChange={this.handleThemeChange}
                                        onDebug={() => { controller["run"](this, {code: this.editorRef.current.getValue(), breakpoints: this.editorRef.current.getBreakpoints()})}}
                                        onResetCode={() => controller["reset-code"](this)}
                                        canDebug={this.state.editorState === READY}
                                        canReset={this.state.editorState === READY}
                                        hasBook={this.props.hasBook}
                                        toggleBookDrawer={this.props.toggleBookDrawer}
                                    />
                                </CardContent>
                            </Card>
                            <ReactMarkdown>{this.state.guideMd}</ReactMarkdown>
                        </Box>
                        <Allotment.Pane maxSize={350} minSize={150} snap={true} 
                            visible={this.state.editorState === RUNNING || 
                                this.state.editorState === ON_BREAKPOINT ||
                                this.state.editorState === AWAITING_INPUT}>
                            <DebugPane 
                                canContinue={this.state.editorState === ON_BREAKPOINT}
                                onContinue={() => controller["continue"](this)}
                                canKill={this.state.editorState === RUNNING || 
                                        this.state.editorState === ON_BREAKPOINT ||
                                        this.state.editorState === AWAITING_INPUT}
                                onKill={() => { controller["restart-worker"](this, {msg: "Interrupted..."})}}
                                debugInfo={this.state.debugInfo}
                            />
                        </Allotment.Pane>
                    </Allotment>
                </Allotment.Pane>
            </Allotment>
            </Box> 
        )
    }
}

export default Challenge