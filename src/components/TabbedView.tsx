import React from "react";
import { Box, Tabs, Tab } from "@mui/material";

type TabbedPane = {
  label: string;
  content: React.ReactNode;
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
      <React.Fragment>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={this.state.currentTab}
            onChange={(evt, newVal) => this.setState({ currentTab: newVal })}
            aria-label="Output tabs"
          >
            {this.props.panes.map((pane, i) => (
              <Tab label={pane.label} key={i} />
            ))}
          </Tabs>
        </Box>
        {this.props.panes.map((pane, i) => (
          <TabPanel value={this.state.currentTab} index={i} key={i}>
            {pane.content}
          </TabPanel>
        ))}
      </React.Fragment>
    );
  }
}

export default TabbedView;
export { TabbedPane };
