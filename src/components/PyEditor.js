import Editor from "@monaco-editor/react"
import React from 'react'
import './PyEditor.css'


class PyEditor extends React.Component {

    breakpointList = [];
    decorator = [];

    state = {theme: "vs-dark"}

    constructor(props) {
        super(props);
        this.editorRef = React.createRef();
        this.monacoRef = React.createRef();
        this.handleEditorDidMount.bind(this);
        this.updateEditorDecorations.bind(this);
        this.handleEditorChange.bind(this);
        this.getValue.bind(this);
        this.getBreakpoints.bind(this);
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

    handleEditorDidMount = (editor, monaco) => {
        this.editorRef.current = editor
        this.monacoRef.current = monaco

        editor.onMouseDown(event => {
            if (!this.props.canPlaceBreakpoint) {
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
                if (this.props.isOnBreakPoint) {
                    let word = model.getWordAtPosition(position);
                    if (word !== undefined && this.props.debugInfo.env.has(word.word)) {
                        console.log(model.getWordAtPosition(position));
                        return {
                            contents: [
                                { value: this.props.debugInfo.env.get(word.word) }
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
        this.decorator = this.editorRef.current.deltaDecorations(this.decorator, 
            this.breakpointList.map(ln => {return {
                range: new this.monacoRef.current.Range(ln, 1, ln, 1),
                options: {
                    isWholeLine: true,
                    className: this.props.isOnBreakPoint && this.props.debugInfo.lineno === ln ? 'breakpoint-hit' : 'breakpoint-waiting',
                    glyphMarginClassName: 'breakpoint-margin'
                }
            }}));
    }

    render() {
        if (this.props.starterCode == null) {
            return (<p>Loading code...</p>)
        } 
        return (  
                <Editor
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