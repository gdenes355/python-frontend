import React, { useContext, useRef, useImperativeHandle } from "react";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import TabbedView from "../components/TabbedView";
import pageTheme, { darkTheme } from "../themes/pageTheme";
import VsThemeContext from "../themes/VsThemeContext";

import PaneType from "../models/PaneType";

type OutputsHandle = {
  focusPane: (pane: PaneType) => void;
};

type OutputsProps = {
  console: React.ReactNode;
  canvas: React.ReactNode;
  fixedInput: React.ReactNode;
};

const Outputs = React.forwardRef<OutputsHandle, OutputsProps>((props, ref) => {
  const themeContext = useContext(VsThemeContext);
  const tabbedViewRef = useRef<TabbedView>(null);

  let panes = [
    {
      label: "Console",
      content: props.console,
      show: true,
      typ: PaneType.CONSOLE,
    },
  ];

  if (props.fixedInput) {
    panes.push({
      label: "Fixed input",
      content: props.fixedInput,
      show: true,
      typ: PaneType.FIXED_INPUT,
    });
  }

  if (props.canvas) {
    panes.push({
      label: "Canvas",
      content: props.canvas,
      show: true,
      typ: PaneType.CANVAS,
    });
  }

  const focusPane = (pane: PaneType) => {
    for (let i = 0; i < panes.length; i++) {
      if (panes[i].typ === pane) {
        tabbedViewRef.current?.requestPane(i);
        return;
      }
    }
  };

  useImperativeHandle(ref, () => ({ focusPane }));

  return (
    <ThemeProvider
      theme={themeContext.theme === "vs-dark" ? darkTheme : pageTheme}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          bgcolor: "background.default",
        }}
      >
        {panes.length > 1 ? (
          <TabbedView ref={tabbedViewRef} panes={panes} />
        ) : (
          props.console
        )}
      </Box>
    </ThemeProvider>
  );
});

export default Outputs;
export { OutputsHandle };
