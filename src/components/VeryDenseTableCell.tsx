import { TableCell, styled, tableCellClasses } from "@mui/material";

const VeryDenseTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: "white",
    fontWeight: "bold",
  },
  [`&.${tableCellClasses.root}`]: {
    padding: 0,

    width: "100%",
    minWidth: 0,

    overflow: "hidden",

    "& > *": {
      minWidth: 0,
      width: "100%",
    },
  },
}));

export default VeryDenseTableCell;
