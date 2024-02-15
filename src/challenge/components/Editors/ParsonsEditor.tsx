import React, {
  useEffect,
  useState,
  useImperativeHandle,
  useRef,
  useContext,
} from "react";
import type ParsonsWidget from "jsparsons";

import VsThemeContext from "../../../themes/VsThemeContext";

import ParsonsEditorThemeWrapper from "./ParsonsEditorThemeWrapper";
import { TestResults } from "../../../models/Tests";

import "./ParsonsEditor.css";
import PyEditor from "./PyEditor";
import ParsonsEditorThemeSplitWrapper from "./ParsonsEditorThemeSplitWrapper";

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

/*
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
*/

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

    const CODE_PLACEHOLDER =
      "##############################\n# ==> YOUR CODE WILL BE INSERTED HERE\n##############################\n";

    const themeContext = useContext(VsThemeContext);

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

    const getHeaderFooterCode = (starterCode: string) => {
      let codeTemplate = "";
      let inbody = false;
      let lines = starterCode.split("\n");

      for (let line of lines) {
        if (line.toLowerCase().replace(" ", "").startsWith("#start")) {
          inbody = true;
          codeTemplate += CODE_PLACEHOLDER;
        } else if (line.toLowerCase().replace(" ", "").startsWith("#end")) {
          inbody = false;
        } else if (!inbody) {
          codeTemplate += line + "\n";
        }
      }
      return codeTemplate;
    };

    const hasHeaderFooterCode = (starterCode: string) => {
      let starterCodeAdjusted = starterCode.replace(/ /g, "").toLowerCase();
      return starterCodeAdjusted.includes("#start");
    };

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

      if (!hasHeaderFooterCode(props.starterCode)) {
        return result;
      } else {
        return getHeaderFooterCode(props.starterCode).replace(
          CODE_PLACEHOLDER,
          result
        );
      }
    };

    useImperativeHandle(ref, () => ({ getValue, runTests, reset }));

    useEffect(() => {
      if (jsLoaded.current !== "unloaded") {
        return;
      }

      jsLoaded.current = "loading";
      // iffe to load all js dependencies sequentially
      (async () => {
        //loadCss("js-parsons/parsons.css");
        //loadCss("js-parsons/lib/prettify.css");
        await loadJS("static/js-parsons/lib/prettify.js");
        await loadJS("static/js-parsons/lib/jquery.min.js");
        await loadJS("static/js-parsons/lib/jquery-ui.min.js");
        await loadJS("static/js-parsons/lib/jquery.ui.touch-punch.min.js");
        await loadJS("static/js-parsons/lib/underscore-min.js");
        await loadJS("static/js-parsons/lib/lis.js");
        await loadJS("static/js-parsons/parsons.js");
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

      const getParsonsCode = (starterCode: string) => {
        if (!hasHeaderFooterCode(starterCode)) {
          return starterCode;
        }

        let codeParsons = "";
        let inbody = false;
        let lines = starterCode.split("\n");

        for (let line of lines) {
          if (line.toLowerCase().replace(" ", "").startsWith("#start")) {
            inbody = true;
          } else if (line.toLowerCase().replace(" ", "").startsWith("#end")) {
            inbody = false;
          } else if (inbody) {
            codeParsons += line + "\n";
          }
        }
        return codeParsons;
      };

      parsons.init(getParsonsCode(props.starterCode));
      parsons.shuffleLines();
    }, [parsons, props.starterCode]);

    if (!hasHeaderFooterCode(props.starterCode)) {
      return (
        <ParsonsEditorThemeWrapper>
          <div
            id="sortableTrash"
            className={"sortable-code " + themeContext.theme}
          ></div>
          <div
            id="sortable"
            className={"sortable-code " + themeContext.theme}
          ></div>
        </ParsonsEditorThemeWrapper>
      );
    } else {
      return (
        <>
          <ParsonsEditorThemeSplitWrapper>
            <div
              id="sortableTrash"
              className={"sortable-code " + themeContext.theme}
            ></div>
            <div
              id="sortable"
              className={"sortable-code " + themeContext.theme}
            ></div>
          </ParsonsEditorThemeSplitWrapper>
          <PyEditor
            canRun={false}
            canEdit={false}
            height="40%"
            canPlaceBreakpoint={false}
            isOnBreakPoint={false}
            starterCode={getHeaderFooterCode(props.starterCode)}
            onToggleFullScreen={() => {}}
            debugContext={{ lineno: 0, locals: new Map(), globals: new Map() }}
            onFocus={() => {}}
          />
        </>
      );
    }
  }
);

export default ParsonsEditor;
export { ParsonsEditorHandle };
