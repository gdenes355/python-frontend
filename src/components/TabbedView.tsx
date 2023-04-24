import React, { useImperativeHandle, useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import "./TabbedView.css";

type TabbedPane = {
  label: string;
  content: React.ReactNode;
  show: boolean;
};

type TabbedViewProps = {
  panes: TabbedPane[];
};

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number | false;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`output-tab-${index}`}
      {...other}
      sx={{
        p: 3,
        width: "100%",
        height: "100%",
        padding: "0px",
        flexGrow: 1,
        overflow: "hidden",
      }}
    >
      {children}
    </Box>
  );
}

type TabbedViewHandle = {
  requestPane: (index: number) => void;
};

const TabbedView = React.forwardRef<TabbedViewHandle, TabbedViewProps>(
  (props, ref) => {
    const [currentTab, setCurrentTab] = useState(0);

    useImperativeHandle(ref, () => ({ requestPane }));

    const requestPane = (index: number) => {
      setCurrentTab(index);
    };

    return (
      <Box sx={{ flexDirection: "column", display: "flex", height: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={currentTab}
            onChange={(evt, newVal) => setCurrentTab(newVal)}
            aria-label="Output tabs"
          >
            {props.panes.map((pane, i) => (
              <Tab
                label={pane.label}
                className={pane.show ? "tab-show" : "tab-hide"}
                key={i}
              />
            ))}
          </Tabs>
        </Box>
        {props.panes.map((pane, i) => (
          <TabPanel value={currentTab} index={i} key={i}>
            {pane.content}
          </TabPanel>
        ))}
      </Box>
    );
  }
);

export default TabbedView;
export { TabbedPane, TabbedViewHandle };
