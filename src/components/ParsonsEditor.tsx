import React from "react";
import type ParsonsWidget from "../types/jsparsons/main";
import "./ParsonsEditor.css";

import { TestResults } from "../models/Tests";

const loadJS = (url: string) =>
  new Promise<void>((r) => {
    const script = document.createElement("script");
    script.src = url;
    script.id = "script-" + url;
    if (document.getElementById(script.id)) {
      r();
    } else {
      script.onload = () => {
        r();
      };
      document.body.appendChild(script);
    }
  });

const loadCss = (url: string) => {
  const tag = document.createElement("link");
  tag.rel = "stylesheet";
  tag.href = url;
  tag.type = "text/css";
  tag.id = "css-" + url;
  if (document.getElementById(tag.id)) {
    return;
  }
  document.body.appendChild(tag);
};

type ParsonsEditorState = {
  jsLoaded: boolean;
  parsons: ParsonsWidget | null;
};

type ParsonsEditorProps = {
  starterCode: string;
};

class ParsonsEditor extends React.Component<
  ParsonsEditorProps,
  ParsonsEditorState
> {
  state: ParsonsEditorState = {
    jsLoaded: false,
    parsons: null,
  };

  getValue() {
    let result = "";
    if (this.state.parsons) {
      let lines = this.state.parsons.normalizeIndents(
        this.state.parsons.getModifiedCode(
          "#ul-" + this.state.parsons.options.sortableId
        )
      );

      for (let line of lines) {
        result += "  ".repeat(line.indent) + line.code + "\n";
      }
    }
    return result;
  }

  runTests(): TestResults {
    let errors = this.state.parsons?.getFeedback() || "initialising";
    if (errors.length === 0) {
      return [{ outcome: true }];
    } else {
      return [{ outcome: false, err: errors }];
    }
  }

  reset() {
    this.state.parsons?.shuffleLines();
  }

  componentDidMount() {
    // iffe to load all js dependencies sequentially
    (async () => {
      loadCss("js-parsons/parsons.css");
      loadCss("js-parsons/lib/prettify.css");
      await loadJS("js-parsons/lib/prettify.js");
      await loadJS("js-parsons/lib/jquery.min.js");
      await loadJS("js-parsons/lib/jquery-ui.min.js");
      await loadJS("js-parsons/lib/jquery.ui.touch-punch.min.js");
      await loadJS("js-parsons/lib/underscore-min.js");
      await loadJS("js-parsons/lib/lis.js");
      await loadJS("js-parsons/parsons.js");
      this.setState({ jsLoaded: true });
    })();
  }

  componentDidUpdate(
    prevProps: ParsonsEditorProps,
    prevState: ParsonsEditorState
  ) {
    if (!prevState.jsLoaded && this.state.jsLoaded) {
      // @ts-ignore
      let parsons = new ParsonsWidget({
        sortableId: "sortable",
        trashId: "sortableTrash",
        max_wrong_lines: 1,
      });
      parsons.init(this.props.starterCode);
      parsons.shuffleLines();
      this.setState({ parsons });
    }
    if (prevProps.starterCode !== this.props.starterCode) {
      this.state.parsons?.init(this.props.starterCode);
      this.state.parsons?.shuffleLines();
    }
  }
  render() {
    return (
      <div>
        <div id="sortableTrash" className="sortable-code"></div>
        <div id="sortable" className="sortable-code"></div>
      </div>
    );
  }
}

export default ParsonsEditor;
