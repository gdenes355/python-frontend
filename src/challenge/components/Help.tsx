import * as React from "react";
import { styled } from "@mui/material/styles";
import { IconButton, Fade } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type HelpProps = {
  onClose: () => void;
};

const Styled = styled("div")(
  ({ theme }) => `
  a
  line-height: 1.5rem;
  overflow-y: auto;
  flex-grow: 1;
  margin-top: 3px;
  padding-bottom: 50px;
  & code { 
    background-color: ${theme.palette.secondary.light};  
    border-radius: 5px; 
    padding: 5px 4px 1px 4px; 
    margin: 5px; 
    min-width: 20px; 
    display: inline-block; 
    text-align: center; 
    height: 1.5em;
  };
  & tr {height: 2.2em};
`
);

const Help = (props: HelpProps) => {
  return (
    <Fade in={true} timeout={500}>
      <Styled>
        <IconButton
          style={{ float: "right", margin: "15px" }}
          onClick={props.onClose}
        >
          <CloseIcon />
        </IconButton>
        <h1>Help</h1>
        <h3>Code editor keyboard shortcuts</h3>
        <table>
          <tbody>
            <tr>
              <td>
                <code>F1</code>
              </td>
              <td>Show commands</td>
            </tr>
            <tr>
              <td>
                <code>F11</code>
              </td>
              <td>Toggle fullscreen</td>
            </tr>
            <tr>
              <td>
                <code>F5</code>
              </td>
              <td>Start debugging</td>
            </tr>
            <tr>
              <td>
                <code>F9</code>
              </td>
              <td>Toggle breakpoint on active line</td>
            </tr>
            <tr>
              <td>
                <code>Alt</code>
                <code>&#8593;</code>
              </td>
              <td>Move line up</td>
            </tr>
            <tr>
              <td>
                <code>Alt</code>
                <code>&#8595;</code>
              </td>
              <td>Move line down</td>
            </tr>
            <tr>
              <td>
                <code>Ctrl</code>
                <code>/</code>
              </td>
              <td>Add/remove comment</td>
            </tr>
          </tbody>
        </table>
        <h4>During debugging</h4>
        <table>
          <tbody>
            <tr>
              <td>
                <code>F10</code>
              </td>
              <td>Step to next command</td>
            </tr>
            <tr>
              <td>
                <code>Shift</code>
                <code>F5</code>
              </td>
              <td>Stop debugging</td>
            </tr>
          </tbody>
        </table>
        <h4>Notes</h4>
        <p>Debugging requires breakpoints to be set.</p>
        <p>Run will ignore breakpoints but be quicker in execution time.</p>
      </Styled>
    </Fade>
  );
};

export default Help;
