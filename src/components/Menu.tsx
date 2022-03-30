import * as React from "react";
import Menu from "@mui/material/Menu";

type MenuProps = {
  button: React.ReactNode;
  children?: React.ReactNode;
};

export default function BasicMenu(props: MenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <span onClick={handleClick}>{props.button}</span>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {props.children}
      </Menu>
    </div>
  );
}
