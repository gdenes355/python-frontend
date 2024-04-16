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
import ChallengeContext from "../../ChallengeContext";
import HeaderButtonsEditor from "./HeaderButtonsEditor";
import HeaderMenuEditor from "./HeaderMenuEditor";
import IBookFetcher from "../../../book/utils/IBookFetcher";
import { saveAs } from "file-saver";
import BookZipper from "../../../book/utils/BookZipper";
import InfoDialog from "../../../components/dialogs/InfoDialog";

type HeaderProps = {
  title?: string;
  bookNode?: BookNodeModel;
  canReloadBook: boolean;
  usesFixedInput: boolean;

  onSetUsesFixedInput: (usesFixedInput: boolean) => void;
  onSetShowBookUpload?: (showBookUpload: boolean) => void;
  codeRunner: CodeRunnerRef;

  // for editing book
  hasEdited: boolean;
  isEditingGuide?: boolean;
  bookFetcher: IBookFetcher;
  onEditingGuideChange: (editing: boolean) => void;
};

const Header = (props: HeaderProps) => {
  const authContext = useContext(SessionContext);
  const challengeContext = useContext(ChallengeContext);

  const [exportText, setExportText] = React.useState<string | undefined>(
    undefined
  );

  const exportBookZip = async () => {
    let book = await props.bookFetcher.fetchBook(authContext);
    const zipper = new BookZipper(props.bookFetcher);
    let zip = await zipper.zipBook(book.book, authContext);
    let blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    });
    saveAs(blob, "challenges.zip");
  };

  const previewAsZip = async () => {
    let book = await props.bookFetcher.fetchBook(authContext);
    const zipper = new BookZipper(props.bookFetcher);
    let zip = await zipper.zipBook(book.book, authContext);
    let res = await zip.generateAsync({
      type: "base64",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    });
    const base64data = encodeURIComponent(res);
    setExportText(
      `${
        window.location.href.split("?")[0]
      }?bk=book.json&zip-data=${base64data}`
    );
  };

  return (
    <>
      <HeaderBar
        title={`${props.title ? props.title + " \u203A " : ""}  ${
          props.bookNode?.name
        }`}
        onHelpOpen={() =>
          window.open("https://www.pythonsponge.com/", "_blank", "noopener")
        }
        menuItems={
          challengeContext?.isEditing ? (
            <HeaderMenuEditor
              onBookDownload={() => exportBookZip()}
              onBookExportAsUrl={() => previewAsZip()}
              onUsingFixedInputChange={props.onSetUsesFixedInput}
              usingFixedInput={props.usesFixedInput}
            />
          ) : (
            <HeaderMenu
              onUsingFixedInputChange={props.onSetUsesFixedInput}
              usingFixedInput={props.usesFixedInput}
              onBookUpload={
                props.onSetShowBookUpload
                  ? () => {
                      props.onSetShowBookUpload?.(true);
                    }
                  : undefined
              }
            />
          )
        }
      >
        {props.canReloadBook ? (
          <Grid item>
            <IconButton onClick={() => challengeContext?.actions["reload"]()}>
              <CachedIcon />
            </IconButton>
          </Grid>
        ) : undefined}
        {challengeContext?.isEditing ? (
          <HeaderButtonsEditor
            editingGuide={props.isEditingGuide}
            onEditingGuideChange={props.onEditingGuideChange}
            hasUnsavedChanges={props.hasEdited}
          />
        ) : (
          <>
            <HeaderButtons
              canReset={props.codeRunner.state === CodeRunnerState.READY}
            />
            {authContext.token ? (
              <Grid item>
                <SessionWsStateIndicator />
              </Grid>
            ) : undefined}
          </>
        )}
      </HeaderBar>
      <InfoDialog
        title="Export as URL"
        open={exportText ? true : false}
        text={exportText}
        onClose={() => setExportText(undefined)}
      />
    </>
  );
};

export default Header;
