import React, { useRef } from "react";
import { SessionFile } from "../../../models/SessionFile";

type SessionFileViewProps = {
  file: SessionFile;
};

type SessionFileViewRef = {};

const SessionFileView = React.forwardRef<
  SessionFileViewRef,
  SessionFileViewProps
>((props, ref) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  if (props.file.isText) {
    return (
      <textarea
        ref={textAreaRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "auto",
          resize: "none",
          padding: "5px",
          borderWidth: "0px",
          outline: "none",
        }}
        onChange={(e) => {
          props.file.data = e.target.value;
        }}
        defaultValue={props.file.data as string}
      />
    );
  }

  // ???
  return (
    <p>
      Unknown file format with {(props.file.data as ArrayBuffer).byteLength}{" "}
      bytes
    </p>
  );
});

export default SessionFileView;
export type { SessionFileViewRef };
