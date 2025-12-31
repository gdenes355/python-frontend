import React from "react";

import { useContext } from "react";
import HeaderBar from "../../../components/HeaderBar";
import BookNodeModel from "../../../models/BookNodeModel";
import SessionContext from "../../../auth/contexts/SessionContext";
import HeaderMenu from "./HeaderMenu";
import { Grid2, IconButton } from "@mui/material";

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
import CodeRunnerControls from "./CodeRunnerControls";
import { TestResults } from "../../../models/Tests";

type HeaderProps = {
  title?: string;
  bookNode?: BookNodeModel;
  canReloadBook: boolean;
  usesFixedInput: boolean;

  onSetUsesFixedInput: (usesFixedInput: boolean) => void;
  codeRunner: CodeRunnerRef;

  // for controls
  canRunOnly: boolean;
  canSubmit: boolean;
  testResults: TestResults;
  isAssessment: boolean;
  onSetShowBookUpload?: (showBookUpload: boolean) => void;

  // for editing book
  canVerifySolutions: boolean;
  isEditing: boolean;
  hasEdited: boolean;
  isEditingGuide?: boolean;
  bookFetcher: IBookFetcher;
  onEditingGuideChange: (editing: boolean) => void;
  onBookUploadToServer: () => void;
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
        }${
          props.isEditing
            ? authContext.isEditingRemote
              ? " (Editing local copy)"
              : " (Editing)"
            : ""
        }`}
        onHelpOpen={() =>
          window.open("https://www.pythonsponge.com/", "_blank", "noopener")
        }
        menuItems={
          challengeContext?.isEditing ? (
            <HeaderMenuEditor
              canUploadRemote={
                authContext.canUploadBook && authContext.isEditingRemote
              }
              onBookDownload={() => exportBookZip()}
              onBookExportAsUrl={() => previewAsZip()}
              onBookUploadRemote={props.onBookUploadToServer}
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
              canReset={props.codeRunner.state === CodeRunnerState.READY}
            />
          )
        }
      >
        <CodeRunnerControls
          codeRunner={props.codeRunner}
          canRunOnly={props.canRunOnly}
          canSubmit={props.canSubmit}
          canVerifySolutions={props.canVerifySolutions}
          testResults={props.testResults}
          isAssessment={props.isAssessment}
        />
        {props.canReloadBook ? (
          <Grid2>
            <IconButton onClick={() => challengeContext?.actions["reload"]()}>
              <CachedIcon />
            </IconButton>
          </Grid2>
        ) : undefined}
        {challengeContext?.isEditing ? (
          <HeaderButtonsEditor
            editingGuide={props.isEditingGuide}
            onEditingGuideChange={props.onEditingGuideChange}
            hasUnsavedChanges={props.hasEdited}
          />
        ) : (
          <>
            <HeaderButtons />
            {authContext.token ? (
              <Grid2>
                <SessionWsStateIndicator />
              </Grid2>
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
