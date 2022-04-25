import React, { useEffect, useState, useImperativeHandle, useRef } from "react";
import type ParsonsWidget from "jsparsons";
import "./ParsonsEditor.css";

import { TestResults } from "../../../models/Tests";

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

type ParsonsEditorHandle = {
  getValue: () => string;
  runTests: () => TestResults;
  reset: () => void;
};

type ParsonsEditorProps = {
  starterCode: string;
};

const ParsonsEditor = React.forwardRef<ParsonsEditorHandle, ParsonsEditorProps>(
  (props, ref) => {
    const [parsons, setParsons] = useState<ParsonsWidget | null>(null);
    const jsLoaded = useRef("unloaded");

    const getValue = () => {
      let result = "";
      if (parsons) {
        let lines = parsons.normalizeIndents(
          parsons.getModifiedCode("#ul-" + parsons.options.sortableId)
        );

        for (let line of lines) {
          result += "  ".repeat(line.indent) + line.code + "\n";
        }
      }
      return result;
    };

    const runTests = () => {
      let errors = parsons?.getFeedback() || "initialising";
      if (errors.length === 0) {
        return [{ outcome: true }];
      } else {
        return [{ outcome: false, err: errors }];
      }
    };

    const reset = () => {
      parsons?.shuffleLines();
    };

    useImperativeHandle(ref, () => ({ getValue, runTests, reset }));

    useEffect(() => {
      if (jsLoaded.current !== "unloaded") {
        return;
      }

      jsLoaded.current = "loading";
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
        jsLoaded.current = "loaded";
        // @ts-ignore
        let newParsons = new ParsonsWidget({
          sortableId: "sortable",
          trashId: "sortableTrash",
          max_wrong_lines: 1,
        });
        setParsons(newParsons);
      })();
    });

    useEffect(() => {
      if (jsLoaded.current !== "loaded" || !parsons) {
        return;
      }
      parsons.init(props.starterCode);
      parsons.shuffleLines();
    }, [parsons, props.starterCode]);

    return (
      <div>
        <div id="sortableTrash" className="sortable-code"></div>
        <div id="sortable" className="sortable-code"></div>
      </div>
    );
  }
);

export default ParsonsEditor;
export { ParsonsEditorHandle };
