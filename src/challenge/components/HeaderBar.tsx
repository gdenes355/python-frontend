import React, { useContext, useMemo } from "react";

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
import LinkIcon from "@mui/icons-material/Link";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import ArticleIcon from "@mui/icons-material/Article";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import Menu from "../../components/Menu";
import FileUploadControl from "../../components/FileUploadControl";

import ChallengeContext from "../ChallengeContext";
import VsThemeContext from "../../themes/VsThemeContext";
import { useLocation } from "react-router-dom";

type HeaderBarProps = {
  title?: string;
  usingFixedInput: boolean;
  showEditTools?: boolean;
  showUploadBookZip: boolean;
  editingGuide?: boolean;
  onUsingFixedInputChange: (fixedInput: boolean) => void;
  onEditingGuideChange?: (editingGuide: boolean) => void;
  onHelpOpen: (open: boolean) => void;
  canReset: boolean;
  canDebug: boolean;
  onBookDownload?: () => void;
  onBookExportAsUrl?: () => void;
  onBookUpload?: () => void;
};

const HeaderBar = (props: HeaderBarProps) => {
  const themeContext = useContext(VsThemeContext);
  const challengeContext = useContext(ChallengeContext);
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location]
  );

  const previewUrl = useMemo(() => {
    let chid = searchParams.get("chid");
    return (
      location.pathname +
      `?book=edit://edit/book.json&chid=${chid}&edit=preview`
    );
  }, [searchParams, location]);

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
        {props.showEditTools
          ? [
              <Grid item key="edit-preview">
                <a href={previewUrl} target="_blank" rel="noreferrer noopener">
                  <Button>Preview</Button>
                </a>
              </Grid>,
              <Grid item key="edit-toggle">
                <FormControlLabel
                  control={
                    <Switch
                      checked={props.editingGuide === true}
                      onChange={() => {
                        props.onEditingGuideChange?.(!props.editingGuide);
                      }}
                    />
                  }
                  label="Edit guide"
                />
              </Grid>,
            ]
          : [
              <Grid item key="py-upload">
                <FileUploadControl
                  onUpload={challengeContext?.actions["handle-code-upload"]}
                />
              </Grid>,
              <Grid item key="py-download">
                <IconButton
                  onClick={() => challengeContext?.actions["download-code"]()}
                >
                  <FileDownload />
                </IconButton>
              </Grid>,
            ]}
        <Grid item>
          <Button
            variant="outlined"
            color="error"
            disabled={!props.canReset}
            onClick={() => challengeContext?.actions["reset-code"]()}
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
                  <MenuItem
                    onClick={() => props.onBookDownload?.()}
                    key="zip-download"
                  >
                    <ListItemIcon>
                      <FolderZipIcon />
                    </ListItemIcon>
                    Export as ZIP
                  </MenuItem>,
                  <MenuItem
                    onClick={() => props.onBookExportAsUrl?.()}
                    key="url-export"
                  >
                    <ListItemIcon>
                      <LinkIcon />
                    </ListItemIcon>
                    Export as URL
                  </MenuItem>,
                ]
              : undefined}
            {props.showUploadBookZip ? (
              <MenuItem
                onClick={() => props.onBookUpload && props.onBookUpload()}
              >
                <ListItemIcon>
                  <ArticleIcon />
                </ListItemIcon>
                Upload Book Zip
              </MenuItem>
            ) : null}
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
