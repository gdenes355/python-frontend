import React, { useContext } from "react";

import {
  Toolbar,
  Box,
  MenuItem,
  FormControlLabel,
  Switch,
  ListItemIcon,
  Grid2,
  IconButton,
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import LogoutIcon from "@mui/icons-material/Logout";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";

import Menu from "./Menu";

import VsThemeContext from "../themes/VsThemeContext";
import SessionContext from "../auth/contexts/SessionContext";

type HeaderBarProps = {
  title?: string;
  children?: React.ReactNode;
  menuItems?: React.ReactNode;
  onHelpOpen?: (open: boolean) => void;
  leftAlignedChilden?: React.ReactNode;
};

const HeaderBar = (props: HeaderBarProps) => {
  const { theme, handleThemeChange } = useContext(VsThemeContext);
  const authContext = useContext(SessionContext);

  return (
    <Toolbar
      variant="dense"
      sx={{
        paddingTop: "2px",
        paddingRight: "2px !important",
        boxShadow:
          theme === "vs-light"
            ? "0px 2px 4px rgba(0, 0, 0, 0.1)"
            : "0px 2px 4px #9bc1c3",
        borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
        marginLeft: "-10px",
        zIndex: 100,
        backgroundColor: theme === "vs-dark" ? "#076669" : "#fff",
      }}
    >
      <Grid2
        container
        spacing={2}
        display="flex"
        sx={{ width: "100%" }}
        alignItems="center"
      >
        <Grid2>
          <Box
            id="logo"
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/logo40.png"
              alt="logo"
              style={{ width: "40px", cursor: "pointer" }}
              onClick={() =>
                window.location.assign(`${window.location.origin}/`)
              }
            />
          </Box>
        </Grid2>
        <Grid2
          sx={{
            verticalAlign: "middle",
            color: theme === "vs-light" ? "#076669" : "#fff",
            fontWeight: "bold",
            marginLeft: 2,
            margin: "auto",
            fontSize: "1.2rem",
          }}
        >
          <span>{props.title || "PythonSponge"}</span>
        </Grid2>
        <Grid2 display="flex" flexGrow={1}>
          <div>{props.leftAlignedChilden || null}</div>
        </Grid2>

        <Grid2 container display="flex" alignItems="center">
          {props.children}
          <Menu
            button={
              <IconButton sx={{ mr: 1 }} size="small">
                <MoreVertIcon />
              </IconButton>
            }
          >
            <MenuItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={theme === "vs-dark"}
                    onChange={() => {
                      handleThemeChange(
                        theme === "vs-dark" ? "vs-light" : "vs-dark"
                      );
                    }}
                    size="small"
                  />
                }
                label="Dark mode"
              />
            </MenuItem>
            {props.menuItems}
            {props.onHelpOpen ? (
              <MenuItem onClick={() => props.onHelpOpen?.(true)}>
                <ListItemIcon>
                  <QuestionMarkIcon />
                </ListItemIcon>
                Help
              </MenuItem>
            ) : undefined}
            {authContext.isTeacher() ? (
              <MenuItem
                onClick={() =>
                  window.location.assign(`${window.location.origin}/teacher`)
                }
              >
                <ListItemIcon>
                  <AssignmentIndIcon />
                </ListItemIcon>
                Teacher portal
              </MenuItem>
            ) : undefined}
            {authContext.isLoggedIn() ? (
              <MenuItem onClick={() => authContext.logout()}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                Log out
              </MenuItem>
            ) : undefined}
          </Menu>
        </Grid2>
      </Grid2>
    </Toolbar>
  );
};

export default HeaderBar;
