import React, { useEffect, useState } from "react";

type AdditionalFileViewProps = {
  defaultValue: string;
  readonly: boolean;
};

type AdditionalFileViewRef = {
  getValue: () => string;
  setValue: (value: string) => void;
};

const AdditionalFileView = React.forwardRef<
  AdditionalFileViewRef,
  AdditionalFileViewProps
>((props, ref) => {
  useEffect(() => {
    setValue(props.defaultValue);
  }, [props.defaultValue]);

  const [currentValue, setCurrentValue] = useState(props.defaultValue);

  const getValue = () => currentValue;
  const setValue = (value: string) => setCurrentValue(value);

  React.useImperativeHandle(ref, () => ({ getValue, setValue }));

  if (props.readonly)
    return (
      <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
        <pre>{currentValue}</pre>
      </div>
    );

  return <div></div>;
});

export default AdditionalFileView;
export type { AdditionalFileViewRef };
