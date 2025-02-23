import React, { useContext } from "react";

import {
  Toolbar,
  Box,
  MenuItem,
  FormControlLabel,
  Switch,
  ListItemIcon,
  Button,
  Grid2,
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
  leftAlignedChilden?: React.ReactNode;
};

const HeaderBar = (props: HeaderBarProps) => {
  const themeContext = useContext(VsThemeContext);
  const authContext = useContext(SessionContext);

  return (
    <Toolbar
      variant="dense"
      sx={{ paddingTop: "2px", paddingRight: "2px !important" }}
    >
      <Grid2 container spacing={2} display="flex" sx={{ width: "100%" }}>
        <Grid2>
          <Box id="logo">
            {/* placeholder if container site wants to replace it */}
            <a href="/">
              <img src="/logo40.png" alt="logo" style={{ width: "40px" }} />
            </a>
          </Box>
        </Grid2>
        <Grid2
          sx={{
            verticalAlign: "middle",
            color: `color-mix(in srgb, #076669 75%, ${
              themeContext.theme === "vs-dark" ? "#fff" : "#000"
            })`,
            fontWeight: "bold",
            marginLeft: 2,
            margin: "auto",
            fontSize: "1.2rem",
          }}
        >
          <span>{props.title || ""}</span>
        </Grid2>
        <Grid2 display="flex" flexGrow={1}>
          <div>{props.leftAlignedChilden || null}</div>
        </Grid2>

        <Grid2 container display="flex">
          {props.children}
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
        </Grid2>
      </Grid2>
    </Toolbar>
  );
};

export default HeaderBar;
