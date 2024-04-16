import { styled } from "@mui/material/styles";

// adapted from the original parsons.css, but respecting themes
const ParsonsEditorThemeWrapper = styled("div")(
  ({ theme }) => `
  
  overflow-y: auto;
  & .sortable-code { 
    width: 47% !important; 
    position: static;
    padding-left: 0px;
    margin-left: 2%;
    float: left;
  }
  & #sortableTrash { width: 38%; }
  & #sortable { width: 56%; }
  & .sortable-code ul {
    font-family: monospace;
    list-style: none;
    background-color: ${theme.palette.background.default};
    padding-bottom: 10px;
    padding-left: 2px;
    padding-right: 2px;
    margin-left: 0;
    border: 3px dashed lightgrey;

  }
  & .sortable-code ul:empty {
    padding-bottom: 30px;
  }
  & .sortable-code li, .sortable-code li:before, .sortable-code li:after {
    box-sizing: content-box;
  }
  & ul.output {
    //background-color: ${theme.palette.secondary.dark};
    border: 3px dashed ${theme.palette.secondary.main};
  }
  & .sortable-code li {
    //-moz-border-radius:10px;
    //-webkit-border-radius:10px;
    //border-radius: 10px;
    background-color:${theme.palette.background.paper};
    border:3px solid lightgray;
    padding:3px;
    margin-top: 5px;
    white-space: nowrap;
    overflow: hidden;
    cursor: move;
    box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 1px -2px
  }
  &.sortable-code li:hover {
      overflow: visible;
  }
  & ul.incorrect {
    //border: 1px solid ${theme.palette.error.main};
    //background-color: ${theme.palette.error.dark};
  }
  & ul.correct {
    background-color: ${theme.palette.success.light};
  }
  & li.incorrectIndent {
      border: 3px solid ${theme.palette.error.main};
      border-left: 10px solid ${theme.palette.error.main};
  }
  & li.correctIndent {
      border: 1px solid ${theme.palette.success.main};
      border-left: 10px solid ${theme.palette.success.main};
  }
  & li.incorrectPosition, .testcase.fail, .testcase.error {
      //background-color: ${theme.palette.error.light};
      border:3px solid ${theme.palette.error.dark};
  }
  & li.correctPosition, .testcase.pass {
      //background-color: ${theme.palette.success.light};
      border:3px solid ${theme.palette.success.main};
  }
  & .testcase { padding: 10px; margin-bottom: 10px;}
  & .testcase .msg { font-weight: bold; }
  & .testcase .error { color: ${theme.palette.error.main};}
  & .testcase .feedback { font-weight: bolder;}
  & .testcase .fail .expected, .testcase .fail .actual {
      color: ${theme.palette.error.main}; 
      font-weight: bolder;
  }
  & .testcase .output { 
      display: block; 
      white-space: pre; 
      background-color: #555555;
      color: white;
      font-size: 12px;
      line-height: 15px;
      margin: 5px;
      padding: 5px;
  }
  /** For styling the toggleable elements */
  & .jsparson-toggle {
      padding: 0 15px;
      display: inline-block;
      border: 1px dashed black;
      z-index: 500;
      cursor: pointer;
      min-width: 10px;
      min-height: 15px;
  }
  & .jsparson-toggle:empty {
      border-color: red;
  }
  & .jsparson-toggle:empty:before {
      content: "??";
      display: block;
      color: red;
  }
`
);

export default ParsonsEditorThemeWrapper;
