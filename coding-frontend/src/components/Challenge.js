import {Button, Box, Grid, AppBar, Toolbar } from '@mui/material';
import Editor from "@monaco-editor/react";
import Console from './Console'
import DebugPane from './DebugPane'
import SpinnerAdornment from './SpinnerAdornment';
import ReactMarkdown from 'react-markdown'
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import React from 'react';

import "./Challenge.css";

const controller = {
    "init-done": (comp, data) =>  comp.setState({editorState: EDITOR_STATE_READY}),
    "print": (comp, data) => comp.setState((state, props) => {return {consoleText: state.consoleText + data.msg}}),
    "input": (comp, data) => comp.setState({awaitingInput: true, editorState: EDITOR_STATE_AWAITING_INPUT}),
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
        comp.setState({editorState: EDITOR_STATE_RUNNING})
    },
    "debug-finished": (comp, data) => {
        let msg = {
            "ok": "Program finished ok. Press debug to run again...",
            "error": "Interrupted by error. Check the error message, then press debug to run again..."
        }[data.reason]
        comp.setState((state, props) => {return {consoleText: state.consoleText + "\n" + msg + "\n", editorState: EDITOR_STATE_READY}}) 
    },
    "restart-worker": (comp, data) => {
        if (comp.state.worker) {
            comp.state.worker.terminate()
        }
        let worker = new window.Worker('./pyworker_sw.js');
        worker.addEventListener("message", (msg) => controller[msg.data.cmd](comp, msg.data));
        let msg = data?.msg == null ? "" : data.msg
        comp.setState((state, props) => {return {consoleText: state.consoleText + msg, worker: worker, editorState: EDITOR_STATE_RESTARTING_WORKER}})
    },
    "run": (comp, data) => {
        comp.state.worker.postMessage({cmd: "run", code: data.code, breakpoints: data.breakpoints}); 
        comp.setState({consoleText: "", editorState: EDITOR_STATE_RUNNING})
    },
    "reset-code": (comp, data) => comp.editorRef.current.setValue(comp.state.starterCode),
    "breakpt": (comp, data) => comp.setState({debugInfo: {lineno: data.lineno, env: new Map([...data.env.entries()].sort())}, editorState: EDITOR_STATE_ON_BREAKPOINT})
}

const EDITOR_STATE_LOADING = 0
const EDITOR_STATE_RESTARTING_WORKER = 1
const EDITOR_STATE_READY = 2
const EDITOR_STATE_AWAITING_INPUT = 3
const EDITOR_STATE_ON_BREAKPOINT = 4
const EDITOR_STATE_RUNNING = 5


class Challenge extends React.Component {

    decorator = [];

    breakpointList = [];

    
    state = {
        starterCode: null, 
        worker: null, 
        consoleText: "Press debug to get started...", 
        guideMd: "Loading...",
        debugInfo: {lineno: 0, env: new Map()},
        editorState: EDITOR_STATE_LOADING
    };

    constructor(props) {
        super(props);
        this.editorRef = React.createRef()
        this.monacoRef = React.createRef();
        this.spaneRef1 = React.createRef()
        this.spaneRef2 = React.createRef()
        this.handleEditorDidMount.bind(this);
        this.updateEditorDecorations.bind(this);
        this.handleEditorChange.bind(this);
    };

    componentDidMount() {
        const guidePath = this.props.guidePath;
        const pyPath = this.props.codePath
        fetch(guidePath)
            .then(response => response.text())
            .then(text => this.setState({guideMd: text}))
        fetch(pyPath)
            .then(response => response.text())
            .then(text => this.setState({starterCode: text}))
        navigator.serviceWorker.register('/pysw.js').then(function(reg) {
            if (navigator.serviceWorker.controller === null || !reg.active) {
                window.location.reload();
            }
        });
    }

    updateEditorDecorations() {
        this.decorator = this.editorRef.current.deltaDecorations(this.decorator, 
            this.breakpointList.map(ln => {return {
                range: new this.monacoRef.current.Range(ln, 1, ln, 1),
                options: {
                    isWholeLine: true,
                    className: this.state.editorState === EDITOR_STATE_ON_BREAKPOINT && this.state.debugInfo.lineno === ln ? 'breakpoint-hit' : 'breakpoint-waiting',
                    glyphMarginClassName: 'breakpoint-margin'
                }
            }}));
    }

    handleEditorDidMount = (editor, monaco) => {
        this.editorRef.current = editor
        this.monacoRef.current = monaco
        controller["restart-worker"](this)

        editor.onMouseDown(event => {
            if (this.state.editorState !== EDITOR_STATE_READY) {
                return;
            }
            if (event.target.type === 2) {
                let lineNum = event.target.position.lineNumber;
                if (this.breakpointList.includes(lineNum)) {
                    let index = this.breakpointList.indexOf(lineNum);
                    this.breakpointList.splice(index, 1)
                } else {
                    this.breakpointList.push(lineNum)
                }
                this.updateEditorDecorations();
            }
        })

        monaco.languages.registerHoverProvider('python', {
            provideHover: (model, position) => { 
                // Log the current word in the console, you probably want to do something else here.
                if (this.state.editorState === EDITOR_STATE_ON_BREAKPOINT) {
                    let word = model.getWordAtPosition(position);
                    if (word !== undefined && this.state.debugInfo.env.has(word.word)) {
                        console.log(model.getWordAtPosition(position));
                        return {
                            contents: [
                                { value: this.state.debugInfo.env.get(word.word) }
                            ]
                        };
                    }
                }
            }
        });
    }    

    handleEditorChange = () => {
        if (this.breakpointList.length > 0) {
            this.updateEditorDecorations();
        }

    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.editorState !== prevState.editorState &&
            (prevState.editorState === EDITOR_STATE_ON_BREAKPOINT ||
            this.state.editorState === EDITOR_STATE_ON_BREAKPOINT))  {
                this.updateEditorDecorations()
            }
    }

    render() {
        if (this.state.starterCode == null) {
            return (<p>Loading guide...</p>)
        }
        return (       
            <Box sx={{width: "100%", height: "100%", overflow: "hidden", bgcolor: "black"}}>

            <AppBar position="sticky" sx={{height: "7vh",bgcolor: "white"}}>
                <Toolbar sx={{ bgcolor: "white"}}>
                    <Grid container spacing={2} sx={{ mt: "0.3", ml: 'auto', mr: 1, width: "auto" }}>
                        <Grid item><Button variant="contained" color="success" 
                            disabled={ this.state.editorState !== EDITOR_STATE_READY  } 
                            onClick={() => { controller["run"](this, {code: this.editorRef.current.getValue(), breakpoints: this.breakpointList})}}>Debug{this.state.editorState === EDITOR_STATE_READY ? null : <SpinnerAdornment/>}</Button>
                        </Grid>
                        <Grid item><Button variant="contained" color="error" 
                            disabled={ this.state.editorState !== EDITOR_STATE_READY } 
                            onClick={() => controller["reset-code"](this)}>Reset</Button>
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>
            <Box sx={{marginTop: "5px", marginLeft: "2px", width: "100%", height: "93vh", bgcolor: "white"}}>
            <Allotment minSize={100} split="vertical" className="h-100">
                <Allotment.Pane minSize={200} >
                    <Allotment vertical>
                        <Allotment.Pane>
                            <Editor
                                width="100%"
                                height="100%"
                                defaultLanguage="python"
                                value={this.state.starterCode}
                                onMount={this.handleEditorDidMount}
                                theme="vs-dark"
                                options={{scrollBeyondLastLine: false, tabSize: 2, detectIndentation: false, glyphMargin: true}}
                                formatOnPaste={true}
                                onChange={this.handleEditorChange}
                            />
                        </Allotment.Pane>
                        <Allotment.Pane>
                            <Console content={this.state.consoleText} isInputEnabled={this.state.editorState === EDITOR_STATE_AWAITING_INPUT} onInput={(input) => {controller["input-entered"](this, {input})}}></Console>
                        </Allotment.Pane>
                    </Allotment>
                </Allotment.Pane>
                <Allotment.Pane minSize={200}>
                    <Allotment vertical >
                        <Box sx={{ m: 2, overflowY: "auto",height: "100%"}}>
                            <ReactMarkdown>{this.state.guideMd}</ReactMarkdown>
                        </Box>
                        <Allotment.Pane maxSize={350} minSize={150} snap={true} 
                            visible={this.state.editorState === EDITOR_STATE_RUNNING || 
                                this.state.editorState === EDITOR_STATE_ON_BREAKPOINT ||
                                this.state.editorState === EDITOR_STATE_AWAITING_INPUT}>
                            <DebugPane 
                                canContinue={this.state.editorState === EDITOR_STATE_ON_BREAKPOINT}
                                onContinue={() => controller["continue"](this)}
                                canKill={this.state.editorState === EDITOR_STATE_RUNNING || 
                                        this.state.editorState === EDITOR_STATE_ON_BREAKPOINT ||
                                        this.state.editorState === EDITOR_STATE_AWAITING_INPUT}
                                onKill={() => { controller["restart-worker"](this, {msg: "Interrupted..."})}}
                                debugInfo={this.state.debugInfo}
                            />
                        </Allotment.Pane>
                    </Allotment>
                </Allotment.Pane>
            </Allotment>
            </Box> 
            </Box>
        )
    }
}

export default Challenge