import React from "react";

import {
  Toolbar,
  Box,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  ListItemIcon,
  Grid,
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import Menu from "../components/Menu";

type HeaderBarProps = {
  title?: string;
  theme: string;
  onThemeChange: (theme: string) => void;
  onHelpOpen: (open: boolean) => void;
};

const HeaderBar = (props: HeaderBarProps) => {
  return (
    <Toolbar variant="dense">
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
            flexGrow: 1,
            verticalAlign: "middle",
            color: "primary.main",
            fontWeight: "bold",
            marginLeft: 2,
            margin: "auto",
          }}
        >
          <span>{props.title || ""}</span>
        </Grid>

        <Grid item>
          <Menu
            button={
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            }
          >
            <MenuItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={props.theme === "vs-dark"}
                    onChange={() => {
                      props.onThemeChange(
                        props.theme === "vs-dark" ? "vs-light" : "vs-dark"
                      );
                    }}
                  ></Switch>
                }
                label="Dark mode"
              />
            </MenuItem>
            <MenuItem onClick={() => props.onHelpOpen(true)}>
              <ListItemIcon>
                <QuestionMarkIcon />
              </ListItemIcon>
              Help
            </MenuItem>
          </Menu>
        </Grid>
      </Grid>
    </Toolbar>
  );
};

export default HeaderBar;
