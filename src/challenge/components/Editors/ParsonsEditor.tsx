import React, {
  useEffect,
  useState,
  useImperativeHandle,
  useRef,
  useContext,
  useMemo,
} from "react";
import type ParsonsWidget from "jsparsons";

import VsThemeContext from "../../../themes/VsThemeContext";

import ParsonsEditorThemeWrapper from "./ParsonsEditorThemeWrapper";
import { TestResults } from "../../../models/Tests";

import "./ParsonsEditor.css";
import PyEditor from "./PyEditor";
import { emptyDebugContext } from "../../../coderunner/DebugContext";

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

const CODE_PLACEHOLDER =
  "##############################\n# ==> YOUR CODE WILL BE INSERTED HERE\n##############################\n";

const ParsonsEditor = React.forwardRef<ParsonsEditorHandle, ParsonsEditorProps>(
  (props, ref) => {
    const [parsons, setParsons] = useState<ParsonsWidget | null>(null);
    const jsLoaded = useRef("unloaded");

    const themeContext = useContext(VsThemeContext);

    // state / memorised values
    const code = useMemo(() => {
      let hasBody = false;
      let inbody = false;
      let codeTemplate = "";
      let bodyCode = "";

      for (let line of props.starterCode.split("\n")) {
        if (line.toLowerCase().replace(" ", "").startsWith("#start")) {
          inbody = true;
          hasBody = true;
          codeTemplate += CODE_PLACEHOLDER;
        } else if (line.toLowerCase().replace(" ", "").startsWith("#end")) {
          inbody = false;
        } else if (!inbody) {
          codeTemplate += line + "\n";
        } else if (inbody) {
          bodyCode += line + "\n";
        }
      }

      if (!hasBody) {
        return {
          parsonsCode: props.starterCode,
          headerFooterCode: undefined,
        };
      }
      return {
        parsonsCode: bodyCode,
        headerFooterCode: codeTemplate,
      };
    }, [props.starterCode]);

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
    }, []);

    useEffect(() => {
      if (jsLoaded.current !== "loaded" || !parsons) {
        return;
      }

      parsons.init(code.parsonsCode);
      parsons.shuffleLines();
    }, [parsons, code]);

    // actions (through ref)
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

      if (code.headerFooterCode) {
        return code.headerFooterCode.replace(CODE_PLACEHOLDER, result);
      } else {
        return result;
      }
    };

    useImperativeHandle(ref, () => ({ getValue, runTests, reset }));

    return (
      <>
        <ParsonsEditorThemeWrapper
          style={{
            height: !code.headerFooterCode ? "100%" : "60%",
          }}
        >
          <div
            id="sortableTrash"
            className={"sortable-code " + themeContext.theme}
          ></div>
          <div
            id="sortable"
            className={"sortable-code " + themeContext.theme}
          ></div>
        </ParsonsEditorThemeWrapper>
        {!!code.headerFooterCode && (
          <PyEditor
            canRun={false}
            canEdit={false}
            height="40%"
            canPlaceBreakpoint={false}
            isOnBreakPoint={false}
            starterCode={code.headerFooterCode}
            onToggleFullScreen={() => {}}
            debugContext={emptyDebugContext}
          />
        )}
      </>
    );
  }
);

export default ParsonsEditor;
export { ParsonsEditorHandle };
