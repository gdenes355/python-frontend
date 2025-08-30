import React, { createContext } from "react";

type Actions = {
  debug: (mode?: "debug" | "run") => void;
  test: () => void;
  "input-entered": (input: string | null) => void;
  kill: () => void;
  step: () => void;
  continue: () => void;
  "breakpoints-updated": () => void;
  "reset-code": () => void;
  "save-code": (code: string) => void;
  "download-code": () => void;
  "handle-file-read": (e: ProgressEvent<FileReader>) => void;
  "handle-code-upload": (file: File) => void;
  "canvas-keydown": (data: React.KeyboardEvent) => void;
  "canvas-keyup": (data: React.KeyboardEvent) => void;
  "hide-turtle": () => void;
  reload: () => void;
  "has-made-edit": () => void;
  "has-changed-session-files": () => void;
  "save-node": () => void;
  "save-book": (book: string) => void;
  "draw-turtle-example": () => void;
  "install-dependencies": (deps: string[]) => void;
};

interface IChallengeContext {
  actions: Actions;
  isEditing: boolean;
}

const wrapActions = (r: React.MutableRefObject<any>) => {
  return {
    debug: (mode?: "debug" | "run") => r.current.debug(mode || "debug"),
    test: () => r.current.test(),
    "input-entered": (input: string | null) =>
      r.current["input-entered"](input),
    kill: () => r.current.kill(),
    step: () => r.current.step(),
    continue: () => r.current.continue(),
    "breakpoints-updated": () => r.current["breakpoints-updated"](),
    "reset-code": () => r.current["reset-code"](),
    "save-code": (code: string) => r.current["save-code"]({ code }),
    "download-code": () => r.current["download-code"](),
    "handle-file-read": (e: ProgressEvent<FileReader>) =>
      r.current["handle-file-read"](e),
    "handle-code-upload": (file: File) => r.current["handle-code-upload"](file),
    "canvas-keydown": (data: React.KeyboardEvent) =>
      r.current["canvas-keydown"](data),
    "canvas-keyup": (data: React.KeyboardEvent) =>
      r.current["canvas-keyup"](data),
    reload: () => r.current.reload(),
    "has-made-edit": () => r.current["has-made-edit"](),
    "has-changed-session-files": () => r.current["has-changed-session-files"](),
    "save-node": () => r.current["save-node"](),
    "save-book": (book: string) => r.current["save-book"](book),
    "hide-turtle": () => r.current["hide-turtle"](),
    "draw-turtle-example": () => r.current["draw-turtle-example"](),
    "install-dependencies": (deps: string[]) =>
      r.current["install-dependencies"](deps),
  };
};

const ChallengeContext = createContext<IChallengeContext | null>(null);

export default ChallengeContext;
export { wrapActions, IChallengeContext, Actions };
