import React, { useRef } from "react";

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
import ArticleIcon from "@mui/icons-material/Article";
import Menu from "../components/Menu";
import InputsDialog from "../components/InputsDialog";
import FileUploadControl from "../components/FileUploadControl";

type HeaderBarProps = {
  title?: string;
  theme: string;
  onThemeChange: (theme: string) => void;
  onHelpOpen: (open: boolean) => void;
  canReset: boolean;
  canDebug: boolean;
  onResetCode: () => void;
  onUpload: (file: File) => void;
};

const HeaderBar = (props: HeaderBarProps) => {

  const inputsDialog = useRef<HTMLDivElement>(null);

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
        <Grid item>
          <FileUploadControl onUpload={props.onUpload} />
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            color="error"
            disabled={!props.canReset}
            onClick={props.onResetCode}
          >
            Reset
          </Button>
        </Grid>
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
            <MenuItem>
              <ListItemIcon>
                <ArticleIcon />
              </ListItemIcon>
              <InputsDialog ref={inputsDialog}/>
            </MenuItem>            
          </Menu>
        </Grid>
      </Grid>
    </Toolbar>
  );
};

export default HeaderBar;
