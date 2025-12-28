import React from "react";
import { MenuItem, ListItemIcon } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import FolderZipIcon from "@mui/icons-material/FolderZip";
import UploadIcon from "@mui/icons-material/Upload";

type HeaderMenuEditorProps = {
  usingFixedInput: boolean;
  canUploadRemote: boolean;
  onUsingFixedInputChange: (fixedInput: boolean) => void;
  onBookDownload?: () => void;
  onBookExportAsUrl?: () => void;
  onBookUploadRemote?: () => void;
};

const HeaderMenuEditor = (props: HeaderMenuEditorProps) => {
  return (
    <React.Fragment>
      {props.canUploadRemote && (
        <MenuItem
          onClick={() => props.onBookUploadRemote?.()}
          key="upload-remote"
        >
          <ListItemIcon>
            <UploadIcon />
          </ListItemIcon>
          Upload to server
        </MenuItem>
      )}
      <MenuItem onClick={() => props.onBookDownload?.()} key="zip-download">
        <ListItemIcon>
          <FolderZipIcon />
        </ListItemIcon>
        Export as ZIP
      </MenuItem>

      <MenuItem onClick={() => props.onBookExportAsUrl?.()} key="url-export">
        <ListItemIcon>
          <LinkIcon />
        </ListItemIcon>
        Export as URL
      </MenuItem>
    </React.Fragment>
  );
};

export default HeaderMenuEditor;
