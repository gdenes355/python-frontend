import { Box, Grid2, Tab, Tabs } from "@mui/material";
import React from "react";
import SessionWsStateIndicator from "../auth/components/SessionWsStateIndicator";
import HeaderBar from "../components/HeaderBar";
import { useMatch, useNavigate } from "react-router-dom";

type TeacherContainerProps = {
  children: React.ReactNode;
  headerChildren?: React.ReactNode;
};

const TeacherContainer = (props: TeacherContainerProps) => {
  const matches = useMatch("/teacher/*");
  const activeTab = matches?.pathname.split("/").at(-1) || "index";
  const navigate = useNavigate();

  return (
    <div className="h-100">
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          flexDirection: "column",
          paddingLeft: "10px",
        }}
      >
        <HeaderBar
          leftAlignedChilden={
            <Tabs
              value={activeTab === "teacher" ? "index" : activeTab}
              onChange={(_, newValue) => {
                if (newValue === "index") navigate("/teacher");
                else if (newValue === "local") navigate("/upload");
                else navigate(`/teacher/${newValue}`);
              }}
            >
              <Tab label="Results" value="index" />
              <Tab label="Classes" value="classes" />
              <Tab label="Local preview" value="local" />
              <Tab label="Server tools" value="tools" />
            </Tabs>
          }
        >
          <React.Fragment>
            <Grid2 key="ws-indicator">
              <SessionWsStateIndicator />
            </Grid2>
            {props.headerChildren}
          </React.Fragment>
        </HeaderBar>
        {props.children}
      </Box>
    </div>
  );
};

export default TeacherContainer;
