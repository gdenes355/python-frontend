import Editor from "@monaco-editor/react"
import React from 'react'
import './PyEditor.css'


class PyEditor extends React.Component {

    breakpointList = [];
    decorator = [];

    state = {theme: "vs-dark"}

    canRunCondition = null;
    canStepCondition = null;
    canPlaceBreakpointCondition = null

    constructor(props) {
        super(props);
        this.editorRef = React.createRef();
        this.monacoRef = React.createRef();
        this.handleEditorDidMount.bind(this);
        this.updateEditorDecorations.bind(this);
        this.handleEditorChange.bind(this);
        this.getValue.bind(this);
        this.getBreakpoints.bind(this);
        this.toggleBreakpoint.bind(this);
        this.revealLine.bind(this);
    };

    getValue() {
        return this.editorRef.current.getValue();
    }

    getBreakpoints() {
        return this.breakpointList;
    }

    setValue(value) {
        this.editorRef.current.setValue(value)
    }

    revealLine(lineNo) {
        this.editorRef.current.revealLine(lineNo)
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.canRunCondition) {
            if (prevProps.canRun !== this.props.canRun) {
                this.canRunCondition.set(this.props.canRun)
            }
            if (prevProps.isOnBreakPoint !== this.props.isOnBreakPoint) {
                this.canStepCondition.set(this.props.isOnBreakPoint)
            }
            if (prevProps.canPlaceBreakpoint !== this.props.canPlaceBreakpoint) {
                this.canPlaceBreakpointCondition.set(this.props.canPlaceBreakpoint)
            }
        }
    }

    handleEditorDidMount = (editor, monaco) => {
        this.editorRef.current = editor
        this.monacoRef.current = monaco

        this.canRunCondition = editor.createContextKey("canRun", false);
        this.canStepCondition = editor.createContextKey("canStep", false);
        this.canPlaceBreakpointCondition = editor.createContextKey("canPlaceBreakpoint", false);

        editor.onMouseDown(event => {
            if (!this.props.canPlaceBreakpoint) {
                return;
            }
            if (event.target.type === 2) {
                let lineNum = event.target.position.lineNumber;
                this.toggleBreakpoint(lineNum);
            }
        })

        editor.addAction({
            id: "togglefullscreen",
            label: "Toggle Full Screen Editor",
            keybindings: [monaco.KeyCode.F11],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            run: () => {
                this.props.onToggleFullScreen()
            }
        })

        editor.addAction({
            id: "debug",
            label: "Debug: Start Debugging",
            keybindings: [monaco.KeyCode.F5],
            precondition: "canRun",
            keybindingContext: null,
            contextMenuGroupId: '1_debug',
            contextMenuOrder: 1.5,
            run: () => {
                this.props.onDebug()
            }
        })

        editor.addAction({
            id: "debug-continue",
            label: "Debug: Continue",
            keybindings: [monaco.KeyCode.F5],
            precondition: "canStep",
            keybindingContext: null,
            contextMenuGroupId: '1_debug',
            contextMenuOrder: 1.5,
            run: () => {
                this.props.onContinue()
            }
        })

        editor.addAction({
            id: "debug-step-into",
            label: "Debug: Step Into",
            keybindings: [monaco.KeyCode.F10],
            precondition: "canStep",
            keybindingContext: null,
            contextMenuGroupId: '1_debug',
            contextMenuOrder: 1.5,
            run: () => {
                this.props.onStepInto()
            }
        })

        editor.addAction({
            id: "debug-stop",
            label: "Debug: Step Into",
            keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.F5],
            precondition: "canStep",
            keybindingContext: null,
            contextMenuGroupId: '1_debug',
            contextMenuOrder: 1.5,
            run: () => {
                this.props.onStop()
            }
        })

        editor.addAction({
            id: "breakpoint",
            label: "Debug: Toggle Breakpoint",
            keybindings: [monaco.KeyCode.F9],
            precondition: "canPlaceBreakpoint",
            keybindingContext: null,
            contextMenuGroupId: '1_debug',
            contextMenuOrder: 1.5,
            run: (ed) => {
                this.toggleBreakpoint(ed.getPosition()?.lineNumber)
            }
        })

        monaco.languages.registerHoverProvider('python', {
            provideHover: (model, position) => { 
                // Log the current word in the console, you probably want to do something else here.
                if (this.props.isOnBreakPoint) {
                    let word = model.getWordAtPosition(position);
                    if (word?.word !== undefined && this.props.debugInfo.env.has(word.word)) {
                        return {
                            contents: [
                                { value: "```text\n" + this.props.debugInfo.env.get(word.word) + "\n```"}
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

    updateEditorDecorations() {
        let stepLine = []
        if (this.props.isOnBreakPoint && this.props.debugInfo.lineno && !this.breakpointList.includes(this.props.debugInfo.lineno)) {
            stepLine = [{
                range: new this.monacoRef.current.Range(this.props.debugInfo.lineno, 1, this.props.debugInfo.lineno, 1),
                options: {
                    isWholeLine: true,
                    className: 'breakpoint-hit'
                }
            }]
        }
        this.decorator = this.editorRef.current.deltaDecorations(this.decorator, 
            this.breakpointList.map(ln => {return {
                range: new this.monacoRef.current.Range(ln, 1, ln, 1),
                options: {
                    isWholeLine: true,
                    className: this.props.isOnBreakPoint && this.props.debugInfo.lineno === ln ? 'breakpoint-hit' : 'breakpoint-waiting',
                    glyphMarginClassName: 'breakpoint-margin'
                }
            }}).concat(stepLine));
    }

    toggleBreakpoint = (lineNum) =>  {
        if (!lineNum) {
            return;
        }
        if (this.breakpointList.includes(lineNum)) {
            let index = this.breakpointList.indexOf(lineNum);
            this.breakpointList.splice(index, 1)
        } else {
            this.breakpointList.push(lineNum)
        }
        this.props.onBreakpointsUpdated()
        this.updateEditorDecorations();
    }

    render() {
        if (this.props.starterCode == null) {
            return (<p>Loading code...</p>)
        } 
        return (  
                <Editor
                className={"theme-" + this.props.theme}
                width="100%"
                height="100%"
                defaultLanguage="python"
                value={this.props.starterCode}
                onMount={this.handleEditorDidMount}
                theme={this.props.theme}
                options={{scrollBeyondLastLine: false, tabSize: 2, detectIndentation: false, glyphMargin: true, wordWrap: "on"}}
                formatOnPaste={true}
                onChange={this.handleEditorChange}
            />           
        )
        
    }
}

export default PyEditor