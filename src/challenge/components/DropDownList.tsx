import React, { useState, useRef, useImperativeHandle } from "react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";

type DropDownListHandle = {
  getValue: () => string;
  getIndex: () => number;
};

type DropDownListProps = {
  disabled: boolean;
  options: string[];
};

const DropDownList = React.forwardRef<DropDownListHandle, DropDownListProps>(
  (props, ref) => {
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const anchorRef = useRef<HTMLDivElement>(null);

    const getValue = () => {
      return props.options[selectedIndex];
    };

    const getIndex = () => {
      return selectedIndex;
    };

    useImperativeHandle(ref, () => ({
      getValue,
      getIndex,
    }));

    const handleMenuItemChoice = (
      event: React.MouseEvent<HTMLLIElement, MouseEvent> | null,
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

    return (
      <React.Fragment>
        <ButtonGroup
          variant="contained"
          ref={anchorRef}
          aria-label="split button"
          fullWidth={true}
        >
          <Button
            variant="contained"
            color="primary"
            disabled={props.disabled}
            style={{ textTransform: "none" }}
          >
            {props.options[selectedIndex]}
          </Button>
          <Button
            size="small"
            aria-controls={open ? "drop-down-list-menu" : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-label="select choice"
            aria-haspopup="menu"
            disabled={props.disabled}
            onClick={() => {
              setOpen((prevOpen) => !prevOpen);
            }}
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
                    {props.options.map((option, index) => (
                      <MenuItem
                        key={option}
                        selected={index === selectedIndex}
                        onClick={(event) => handleMenuItemChoice(event, index)}
                      >
                        {option}
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
);

export default DropDownList;
export { DropDownListHandle };
