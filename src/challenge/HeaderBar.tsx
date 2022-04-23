import React, { useContext } from "react";

import {
  Toolbar,
  Box,
  IconButton,
  MenuItem,
  FormControlLabel,
  Switch,
  ListItemIcon,
  Grid,
  Button,
} from "@mui/material";

import { FileDownload } from "@mui/icons-material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import Menu from "../components/Menu";
import FileUploadControl from "../components/FileUploadControl";

import VsThemeContext from "../themes/VsThemeContext";

type HeaderBarProps = {
  title?: string;
  usingFixedInput: boolean;
  showEditTools: boolean;
  editingGuide: boolean;
  onUsingFixedInputChange: (fixedInput: boolean) => void;
  onEditingGuideChange: (editingGuide: boolean) => void;
  onHelpOpen: (open: boolean) => void;
  canReset: boolean;
  canDebug: boolean;
  onResetCode: () => void;
  onUpload: (file: File) => void;
  onDownload: () => void;
  onAddToExport: () => void;
  onBookDownload: () => void;
};

const HeaderBar = (props: HeaderBarProps) => {
  const themeContext = useContext(VsThemeContext);
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
          <IconButton onClick={props.onDownload}>
            <FileDownload />
          </IconButton>
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
            <MenuItem>
              <FormControlLabel
                control={
                  <Switch
                    checked={props.usingFixedInput === true}
                    onChange={() => {
                      props.onUsingFixedInputChange(!props.usingFixedInput);
                    }}
                  />
                }
                label="Use fixed inputs"
              />
            </MenuItem>
            {props.showEditTools
              ? [
                  <MenuItem>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={props.editingGuide === true}
                          onChange={() => {
                            props.onEditingGuideChange(!props.editingGuide);
                          }}
                        />
                      }
                      label="Edit challenge"
                    />
                  </MenuItem>,
                  <MenuItem onClick={() => props.onAddToExport()}>
                    <ListItemIcon>
                      <ArrowCircleDownIcon />
                    </ListItemIcon>
                    Add to export
                  </MenuItem>,
                  <MenuItem onClick={() => props.onBookDownload()}>
                    <ListItemIcon>
                      <FolderZipIcon />
                    </ListItemIcon>
                    Export book
                  </MenuItem>,
                ]
              : null}
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
