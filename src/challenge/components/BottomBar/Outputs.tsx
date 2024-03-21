import React, { useRef, useImperativeHandle } from "react";
import { Box } from "@mui/material";

import TabbedView, { TabbedViewHandle } from "../../../components/TabbedView";

import PaneType from "../../../models/PaneType";
import { AdditionalFiles } from "../../../models/AdditionalFiles";

type OutputsHandle = {
  focusPane: (pane: PaneType) => void;
};

type OutputsProps = {
  console: React.ReactNode;
  canvas: React.ReactNode;
  fixedInput: React.ReactNode;
  json?: React.ReactNode;
  files: Array<React.ReactNode>;
  fileProperties: AdditionalFiles;
  fileShowAll: boolean;
  visiblePanes: PaneType[];
};

const Outputs = React.forwardRef<OutputsHandle, OutputsProps>((props, ref) => {
  const tabbedViewRef = useRef<TabbedViewHandle>(null);

  let panes = [
    {
      label: "Console",
      content: props.console,
      show: props.visiblePanes.includes("console"),
      name: "console",
    },
  ];

  if (props.fixedInput) {
    panes.push({
      label: "Fixed input",
      content: props.fixedInput,
      show: props.visiblePanes.includes("fixed-input"),
      name: "fixed-input",
    });
  }

  if (props.canvas) {
    panes.push({
      label: "Canvas",
      content: props.canvas,
      show: props.visiblePanes.includes("canvas"),
      name: "canvas",
    });
  }

  if (props.json) {
    panes.push({
      label: "Edit challenge",
      content: props.json,
      show: props.visiblePanes.includes("json"),
      name: "json",
    });
  }

  if (props.fileProperties) {
    props.fileProperties.forEach((file, index) => {
      panes.push({
        label: file.filename,
        content: props.files[index],
        show: file.visible || props.fileShowAll,
        name: file.filename,
      });
    });
  }

  const focusPane = (pane: PaneType) => {
    tabbedViewRef.current?.requestPane(pane);
  };

  useImperativeHandle(ref, () => ({ focusPane }));

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      <TabbedView ref={tabbedViewRef} panes={panes} />
    </Box>
  );
});

export default Outputs;
export { OutputsHandle };
