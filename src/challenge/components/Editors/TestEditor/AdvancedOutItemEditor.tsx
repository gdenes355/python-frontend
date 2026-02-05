import React, { useEffect, useImperativeHandle, useState } from "react";
import {
  AdvancedOutRequirement,
  AdvancedOutRequirementIgnore,
  AdvancedOutRequirementType,
} from "../../../../models/Tests";
import {
  IconButton,
  MenuItem,
  Select,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import VeryDenseTableCell from "../../../../components/VeryDenseTableCell";
import ClearIcon from "@mui/icons-material/Clear";
import { RegexInput } from "./RegexEditor";

type AdvancedOutItemEditorHandle = {
  getValue: () => AdvancedOutRequirement;
};

type AdvancedOutItemEditorProps = {
  req: AdvancedOutRequirement;
  onChange?: () => void;
  onDel?: () => void;
};

const typs = ["+", "-", "c+", "c-", "f+", "f-", "s+", "s-", "t"];
const TYP_TO_READABLE: Map<string, string> = new Map([
  ["+", "output matches (+)"],
  ["-", "output doesn't match (-)"],
  ["c+", "code contains (c+)"],
  ["c-", "code doesn't contain (c-)"],
  ["f+", "file contains (f+)"],
  ["f-", "file doesn't contain (f-)"],
  ["s+", "statement result contains (s+)"],
  ["s-", "statement result doesn't contain (s-)"],
  ["t", "Turtle test (t)"],
]);

const AdvancedOutItemEditor = React.forwardRef<
  AdvancedOutItemEditorHandle,
  AdvancedOutItemEditorProps
>((props, ref) => {
  const [pattern, setPattern] = useState<string>(props.req.pattern);
  const [isRegex, setIsRegex] = useState<boolean>(
    props.req.regex === false ? false : true
  );
  const [ignore, setIgnore] = useState<("w" | "c" | "p")[]>([]);
  const [count, setCount] = useState<number>(props.req.count || -1);
  const [typ, setTyp] = useState<AdvancedOutRequirementType>(
    props.req.typ || "+"
  );
  const [fileName, setFileName] = useState<string>(props.req.filename || "");
  const [statement, setStatement] = useState<string>(props.req.statement || "");

  useEffect(() => {
    setPattern(props.req.pattern);
    setIsRegex(props.req.regex === false ? false : true);
    setIgnore(
      (props.req.ignore || "")
        .split("")
        .filter((c) => ["w", "c", "p"].includes(c)) as ("w" | "c" | "p")[]
    );
    setCount(props.req.count || -1);
    setTyp(props.req.typ || "+");
    setFileName(props.req.filename || "");
    setStatement(props.req.statement || "");
  }, [
    props.req.pattern,
    props.req.regex,
    props.req.ignore,
    props.req.count,
    props.req.typ,
    props.req.filename,
    props.req.statement,
  ]);

  const getValue = () => {
    let aignore = ignore.includes("w") ? "w" : "";
    aignore += ignore.includes("c") ? "c" : "";
    aignore += ignore.includes("p") ? "p" : "";

    return {
      pattern,
      regex: isRegex === true ? undefined : false,
      ignore: aignore ? (aignore as AdvancedOutRequirementIgnore) : undefined,
      count: count === -1 ? undefined : count,
      typ: typ[0] === "+" ? undefined : typ,
      filename: typ[0] === "f" || typ[0] === "t" ? fileName : undefined,
      statement: typ[0] === "s" ? statement : undefined,
    };
  };

  useImperativeHandle(ref, () => ({
    getValue,
  }));

  return (
    <TableRow>
      <VeryDenseTableCell>
        {isRegex ? (
          <RegexInput
            value={pattern || ""}
            onChange={(e) => {
              const value = e.target.value;
              setPattern(value);
              props.onChange?.();
            }}
            variant="standard"
          />
        ) : (
          <TextField
            value={pattern || ""}
            onChange={(e) => {
              setPattern(e.target.value);
              props.onChange?.();
            }}
            size="small"
            variant="standard"
            hiddenLabel={true}
            inputProps={{ style: { fontFamily: "monospace" } }}
          />
        )}
        {typ[0] === "f" || typ[0] === "t" ? (
          <TextField
            value={fileName || ""}
            placeholder="File name"
            onChange={(e) => {
              setFileName(e.target.value);
              props.onChange?.();
            }}
            size="small"
            variant="filled"
            hiddenLabel={true}
            inputProps={{ style: { fontFamily: "monospace", padding: 0 } }}
            sx={{ width: "98%", paddingLeft: "20px" }}
          />
        ) : typ[0] === "s" ? (
          <TextField
            value={statement || ""}
            placeholder="code statement"
            onChange={(e) => {
              setStatement(e.target.value);
              props.onChange?.();
            }}
            size="small"
            variant="filled"
            hiddenLabel={true}
            inputProps={{ style: { fontFamily: "monospace", padding: 0 } }}
            sx={{ width: "98%", paddingLeft: "20px" }}
          />
        ) : null}
      </VeryDenseTableCell>
      <VeryDenseTableCell>
        <ToggleButton
          value="regex"
          selected={isRegex}
          onChange={() => {
            setIsRegex(!isRegex);
            props.onChange?.();
          }}
          size="small"
        >
          <span>.*</span>
        </ToggleButton>
      </VeryDenseTableCell>
      <VeryDenseTableCell>
        <Select
          value={typ}
          variant="standard"
          size="small"
          onChange={(e) => {
            setTyp(e.target.value as AdvancedOutRequirementType);
            props.onChange?.();
          }}
          renderValue={(selected) => {
            // Short label in collapsed view
            return selected as string;
          }}
        >
          {typs.map((t) => (
            <MenuItem value={t} key={t}>
              {TYP_TO_READABLE.get(t) ?? t}
            </MenuItem>
          ))}
        </Select>
      </VeryDenseTableCell>
      <VeryDenseTableCell>
        <ToggleButtonGroup
          size="small"
          value={ignore}
          onChange={(_, v) => {
            setIgnore(v || []);
            props.onChange?.();
          }}
        >
          <ToggleButton value="w">
            <span>␣</span>
          </ToggleButton>
          <ToggleButton value="c">
            <span style={{ textTransform: "none" }}>Aa</span>
          </ToggleButton>
          <ToggleButton value="p">
            <span>!</span>
          </ToggleButton>
        </ToggleButtonGroup>
      </VeryDenseTableCell>
      <VeryDenseTableCell>
        <TextField
          autoComplete="off"
          value={count === -1 ? "" : count}
          onChange={(e) => {
            setCount(parseInt(e.target.value) || -1);
            props.onChange?.();
          }}
          size="small"
          variant="standard"
          hiddenLabel={true}
          inputProps={{ style: { fontFamily: "monospace" }, type: "number" }}
          sx={{ width: "50px" }}
        />
      </VeryDenseTableCell>
      <VeryDenseTableCell>
        <Tooltip title="Remove this output check">
          <IconButton
            aria-label="remove watch"
            size="small"
            onClick={props.onDel}
            style={{ float: "right" }}
          >
            <ClearIcon color="error" fontSize="small" />
          </IconButton>
        </Tooltip>
      </VeryDenseTableCell>
    </TableRow>
  );
});

export default AdvancedOutItemEditor;
export { AdvancedOutItemEditorHandle };
