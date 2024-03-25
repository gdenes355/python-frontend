import { TableCell, styled, tableCellClasses } from "@mui/material";

const VeryDenseTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: "white",
    fontWeight: "bold",
  },
  [`&.${tableCellClasses.root}`]: {
    padding: 0,
  },
}));

export default VeryDenseTableCell;
