import React, { useRef, useImperativeHandle, useEffect } from "react";
import { Box } from "@mui/material";

import TabbedView from "../../components/TabbedView";

import PaneType from "../../models/PaneType";

type OutputsHandle = {
  focusPane: (pane: PaneType) => void;
  currentPane: PaneType | null;
};

type OutputsProps = {
  console: React.ReactNode;
  canvas: React.ReactNode;
  fixedInput: React.ReactNode;
  json?: React.ReactNode;
};

const Outputs = React.forwardRef<OutputsHandle, OutputsProps>((props, ref) => {
  useEffect(() => {
    setCurrentPane(null);
  }, [props.console, props.canvas, props.fixedInput, props.json]);

  const tabbedViewRef = useRef<TabbedView>(null);

  const [currentPane, setCurrentPane] = React.useState<PaneType | null>(null);

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

  if (props.json) {
    panes.push({
      label: "Edit challenge",
      content: props.json,
      show: true,
      typ: PaneType.JSON_EDITOR,
    });
  }

  const focusPane = (pane: PaneType) => {
    if (currentPane === pane) {
      return true;
    }
    for (let i = 0; i < panes.length; i++) {
      if (panes[i].typ === pane) {
        tabbedViewRef.current?.requestPane(i);
        setCurrentPane(pane);
        return true;
      }
    }
    return false;
  };

  useImperativeHandle(ref, () => ({ focusPane, currentPane }));

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      {panes.length > 1 ? (
        <TabbedView ref={tabbedViewRef} panes={panes} />
      ) : (
        props.console
      )}
    </Box>
  );
});

export default Outputs;
export { OutputsHandle };
