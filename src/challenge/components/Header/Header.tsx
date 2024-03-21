import React from "react";

import { useContext } from "react";
import HeaderBar from "../../../components/HeaderBar";
import BookNodeModel from "../../../models/BookNodeModel";
import SessionContext from "../../../auth/SessionContext";
import HeaderMenu from "./HeaderMenu";
import { Grid, IconButton } from "@mui/material";

import CachedIcon from "@mui/icons-material/Cached";
import SessionWsStateIndicator from "../../../auth/components/SessionWsStateIndicator";
import HeaderButtons from "./HeaderButtons";
import {
  CodeRunnerRef,
  CodeRunnerState,
} from "../../../coderunner/useCodeRunner";

type HeaderProps = {
  title?: string;
  bookNode?: BookNodeModel;
  canReloadBook: boolean;
  usesFixedInput: boolean;

  onSetUsesFixedInput: (usesFixedInput: boolean) => void;
  onSetShowBookUpload: (showBookUpload: boolean) => void;
  onBookReloadRequested: () => void;
  codeRunner: CodeRunnerRef;
};

const Header = (props: HeaderProps) => {
  const authContext = useContext(SessionContext);
  return (
    <HeaderBar
      title={`${props.title ? props.title + " \u203A " : ""}  ${
        props.bookNode?.name
      }`}
      onHelpOpen={() =>
        window.open("https://www.pythonsponge.com/", "_blank", "noopener")
      }
      menuItems={
        <HeaderMenu
          onUsingFixedInputChange={(fixedInput) =>
            props.onSetUsesFixedInput(fixedInput)
          }
          usingFixedInput={props.usesFixedInput}
          onBookUpload={() => {
            props.onSetShowBookUpload(true);
          }}
        />
      }
    >
      {props.canReloadBook ? (
        <Grid item>
          <IconButton
            onClick={() => {
              // TODO:
              // fetch guide
              //this.chContext.actions["fetch-code"](true);
              props.onBookReloadRequested();
            }}
          >
            <CachedIcon />
          </IconButton>
        </Grid>
      ) : undefined}
      {authContext.token ? (
        <Grid item>
          <SessionWsStateIndicator />
        </Grid>
      ) : undefined}
      <HeaderButtons
        canReset={props.codeRunner.state === CodeRunnerState.READY}
      />
    </HeaderBar>
  );
};

export default Header;
