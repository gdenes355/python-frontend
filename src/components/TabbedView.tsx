import React, { useEffect, useImperativeHandle, useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import "./TabbedView.css";

type TabbedPane = {
  label: string;
  content: React.ReactNode;
  show: boolean;
  name: string;
};

type TabbedViewProps = {
  panes: TabbedPane[];
};

type TabPanelProps = {
  children?: React.ReactNode;
  name: string;
  activeName: string | null;
};

function TabPanel(props: TabPanelProps) {
  const { children, name, activeName, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={name !== activeName}
      id={`tabpanel-${name}`}
      aria-labelledby={`output-tab-${name}`}
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
  requestPane: (name: string) => void;
};

const TabbedView = React.forwardRef<TabbedViewHandle, TabbedViewProps>(
  (props, ref) => {
    const [currentTab, setCurrentTab] = useState<string | null>(null);
    const [showTabBar, setShowTabBar] = useState<boolean>(true);

    const pendingRequestedTab = React.useRef<string | null>(null);

    useImperativeHandle(ref, () => ({ requestPane }));

    useEffect(() => {
      if (pendingRequestedTab.current) {
        if (
          props.panes.find(
            (p) => p.name === pendingRequestedTab.current && p.show
          )
        ) {
          pendingRequestedTab.current = null;
          setCurrentTab(pendingRequestedTab.current);
        }
      }
      setShowTabBar(props.panes.filter((p) => p.show).length > 1);
    }, [props.panes]);

    const requestPane = (name: string | null) => {
      if (!!name || props.panes.find((p) => p.name === name)) {
        // we can make this change immediately
        pendingRequestedTab.current = null;
        setCurrentTab(name);
      } else {
        pendingRequestedTab.current = name;
        setCurrentTab(null);
      }
    };

    // if the current tab is not visible, switch to the first tab (assumed to be visible)
    const actualCurrent =
      currentTab && props.panes.find((p) => p.name === currentTab && p.show)
        ? currentTab
        : props.panes[0].name;

    return (
      <Box sx={{ flexDirection: "column", display: "flex", height: "100%" }}>
        {showTabBar ? (
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={actualCurrent}
              onChange={(evt, newVal) => setCurrentTab(newVal)}
              aria-label="Output tabs"
            >
              {props.panes.map((pane) => (
                <Tab
                  value={pane.name}
                  label={pane.label}
                  className={pane.show ? "tab-show" : "tab-hide"}
                  key={pane.name}
                />
              ))}
            </Tabs>
          </Box>
        ) : null}
        {props.panes.map((pane) => (
          <TabPanel activeName={actualCurrent} name={pane.name} key={pane.name}>
            {pane.content}
          </TabPanel>
        ))}
      </Box>
    );
  }
);

export default TabbedView;
export { TabbedPane, TabbedViewHandle };
