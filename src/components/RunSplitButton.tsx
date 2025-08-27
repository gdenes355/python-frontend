import React, { useState, useContext, useRef } from "react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import ChallengeContext from "../challenge/ChallengeContext";
import RunIcon from "../icons/RunIcon";
import DebugIcon from "../icons/DebugIcon";

type RunSplitButtonProps = {
  disabled: boolean;
  canRunOnly: boolean;
};

const options = ["DEBUG", "RUN"];
const icons = [() => <DebugIcon />, () => <RunIcon />];

export default function RunSplitButton(props: RunSplitButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);

  const challengeContext = useContext(ChallengeContext);

  const handleClick = () => {
    const mode: "debug" | "run" = selectedIndex === 0 ? "debug" : "run";
    challengeContext?.actions["debug"](mode);
  };

  const handleMenuItemClick = (
    _: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  return props.canRunOnly ? (
    <Button
      variant="contained"
      color="primary"
      disabled={props.disabled}
      onClick={() => challengeContext?.actions["debug"]("run")}
      size="small"
      startIcon={<RunIcon />}
    >
      RUN
    </Button>
  ) : (
    <React.Fragment>
      <ButtonGroup
        variant="contained"
        ref={anchorRef}
        aria-label="split button"
      >
        <Button
          onClick={handleClick}
          variant="contained"
          color="primary"
          disabled={props.disabled}
          size="small"
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {icons[selectedIndex]()}
          <span style={{ marginLeft: "10px" }}>{options[selectedIndex]}</span>
        </Button>
        <Button
          size="small"
          aria-controls={open ? "run-split-button-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-label="select run choice"
          aria-haspopup="menu"
          disabled={props.disabled}
          onClick={() => setOpen((prevOpen) => !prevOpen)}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option}
                      disabled={index === 2}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {icons[index]()}
                      <span style={{ marginLeft: "10px" }}>{option}</span>
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
}
