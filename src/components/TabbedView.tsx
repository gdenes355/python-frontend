import React from "react";
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

type TabbedViewState = {
  currentTab: number | false;
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

class TabbedView extends React.Component<TabbedViewProps, TabbedViewState> {
  constructor(props: TabbedViewProps) {
    super(props);
    this.requestPane.bind(this);
  }

  state: TabbedViewState = {
    currentTab: false,
  };

  requestPane(index: number) {
    this.setState({ currentTab: index });
  }

  componentDidMount() {
    this.setState({ currentTab: 0 });
  }

  render() {
    return (
      <Box sx={{ flexDirection: "column", display: "flex", height: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={this.state.currentTab}
            onChange={(evt, newVal) => this.setState({ currentTab: newVal })}
            aria-label="Output tabs"
          >
            {this.props.panes.map((pane, i) => (
              <Tab
                label={pane.label}
                className={pane.show ? "tab-show" : "tab-hide"}
                key={i}
              />
            ))}
          </Tabs>
        </Box>
        {this.props.panes.map((pane, i) => (
          <TabPanel value={this.state.currentTab} index={i} key={i}>
            {pane.content}
          </TabPanel>
        ))}
      </Box>
    );
  }
}

export default TabbedView;
export { TabbedPane };
