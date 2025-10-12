import { Autocomplete, Box, Checkbox, TextField } from "@mui/material";
import { useMemo } from "react";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

type BookInputProps = {
  disabled: boolean;
  activeBooks: string[];
  inactiveBooks: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  onUpdateBookActive: (book: string, active: boolean) => void;
};

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const BookInput = ({
  disabled,
  activeBooks,
  inactiveBooks,
  value,
  onChange,
  onUpdateBookActive,
}: BookInputProps) => {
  const options = useMemo(
    () => [
      ...activeBooks.sort().map((b) => ({ bookTitle: b, enabled: true })),
      ...inactiveBooks.sort().map((b) => ({ bookTitle: b, enabled: false })),
    ],
    [activeBooks, inactiveBooks]
  );
  const optionValue = useMemo(
    () => options.find((o) => o.bookTitle === value),
    [options, value]
  );
  return (
    <Autocomplete
      size="small"
      value={optionValue || null}
      onChange={(_, n) => onChange(n?.bookTitle || null)}
      options={options}
      groupBy={(option) => (option.enabled ? "Enabled" : "Disabled")}
      getOptionLabel={(option) =>
        option
          ? option.bookTitle.replace(/^books\//, "").replace(/\//g, "  /  ")
          : ""
      }
      renderInput={(params) => (
        <>
          <TextField {...params} label="Book" />
        </>
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.bookTitle}>
          <Box sx={{ flex: 1 }}>
            {option.bookTitle.replace(/^books\//, "").replace(/\//g, " / ")}
          </Box>
          <Checkbox
            icon={icon}
            checkedIcon={checkedIcon}
            style={{ marginRight: 8 }}
            checked={option.enabled}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              onUpdateBookActive(option.bookTitle, e.target.checked);
            }}
          />
        </li>
      )}
      disabled={disabled}
    />
  );
};

export default BookInput;
