import React, { useContext } from "react";

import {
  Toolbar,
  Box,
  MenuItem,
  FormControlLabel,
  Switch,
  ListItemIcon,
  Grid,
  Button,
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import LogoutIcon from "@mui/icons-material/Logout";

import Menu from "./Menu";

import VsThemeContext from "../themes/VsThemeContext";
import SessionContext from "../auth/SessionContext";

type HeaderBarProps = {
  title?: string;
  children?: React.ReactNode;
  menuItems?: React.ReactNode;
  onHelpOpen?: (open: boolean) => void;
};

const HeaderBar = (props: HeaderBarProps) => {
  const themeContext = useContext(VsThemeContext);
  const authContext = useContext(SessionContext);

  return (
    <Toolbar variant="dense" sx={{ paddingTop: "2px" }}>
      <Grid container spacing={2} style={{ display: "flex" }}>
        <Grid item>
          <Box id="logo">
            {/* placeholder if container site wants to replace it */}
            <a href="/">
              <img
                src="/static/img/header.png"
                alt="logo"
                style={{ width: "40px" }}
              />
            </a>
          </Box>
        </Grid>
        <Grid
          item
          sx={{
            verticalAlign: "middle",
            color: "primary.main",
            fontWeight: "bold",
            marginLeft: 2,
            margin: "auto",
          }}
        >
          <span>{props.title || ""}</span>
        </Grid>
        <Grid
          item
          sx={{ flexGrow: 1, justifyContent: "center", display: "flex" }}
        >
          <div></div>
        </Grid>

        {props.children}

        <Grid item>
          <Menu
            button={
              <Button variant="contained" color="primary">
                <MoreVertIcon />
              </Button>
            }
          >
            <MenuItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={themeContext.theme === "vs-dark"}
                    onChange={() => {
                      themeContext.handleThemeChange(
                        themeContext.theme === "vs-dark"
                          ? "vs-light"
                          : "vs-dark"
                      );
                    }}
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
            {authContext.isLoggedIn() ? (
              <MenuItem onClick={() => authContext.logout()}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                Log out
              </MenuItem>
            ) : undefined}
          </Menu>
        </Grid>
      </Grid>
    </Toolbar>
  );
};

export default HeaderBar;
