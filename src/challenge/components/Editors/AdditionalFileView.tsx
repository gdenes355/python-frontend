import React, { useRef } from "react";

type AdditionalFileViewProps = {
  defaultValue: string;
  readonly: boolean;
  onChange?: () => void;
};

type AdditionalFileViewRef = {
  getValue: () => string;
};

const AdditionalFileView = React.forwardRef<
  AdditionalFileViewRef,
  AdditionalFileViewProps
>((props, ref) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const getValue = () => {
    if (textAreaRef.current) {
      return textAreaRef.current.value;
    }

    return props.defaultValue;
  };
  React.useImperativeHandle(ref, () => ({ getValue }));

  // view in challenge
  if (props.readonly)
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "auto",
          paddingLeft: "5px",
          paddingRight: "5px",
          paddingTop: "0px",
        }}
      >
        <pre>{props.defaultValue}</pre>
      </div>
    );

  // or edit
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
        if (e.target.value !== props.defaultValue) {
          props.onChange?.();
        }
      }}
      defaultValue={props.defaultValue}
    />
  );
});

export default AdditionalFileView;
export type { AdditionalFileViewRef };
