import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";

type TabbedPane = {
  label: string;
  content: React.ReactNode;
};

type TabbedViewProps = {
  panes: TabbedPane[];
};

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ height: "100%" }}
      {...other}
    >
      <Box sx={{ p: 3, width: "100%", height: "100%", padding: "0px" }}>
        {children}
      </Box>
    </div>
  );
}

const TabbedView = (props: TabbedViewProps) => {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <React.Fragment>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={currentTab}
          onChange={(evt, newVal) => setCurrentTab(newVal)}
          aria-label="Output tabs"
        >
          {props.panes.map((pane, i) => (
            <Tab label={pane.label} key={i} />
          ))}
        </Tabs>
      </Box>
      {props.panes.map((pane, i) => (
        <TabPanel value={currentTab} index={i}>
          {pane.content}
        </TabPanel>
      ))}
    </React.Fragment>
  );
};

export default TabbedView;
export { TabbedPane };
