import { useContext, useEffect, useState } from "react";
import Console from "../../../components/Console";
import ChallengeContext from "../../ChallengeContext";
import { Box, Button, Stack } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";

const ChallengeConsole = (props: {
  content: string;
  inputEnabled: boolean;
  ready: boolean;
}) => {
  const challengeContext = useContext(ChallengeContext);

  const [hasError, setHasError] = useState(false);
  const [missingDeps, setMissingDeps] = useState<string[]>([]);

  useEffect(() => {
    if (props.ready) {
      if (
        props.content.includes(
          "Interrupted by error. Check the error message, then press run/debug to execute again"
        )
      ) {
        setHasError(true);
      }
      // re match The module 'package name' is included in the Pyodide distribution, but it is not installed.
      const missing = props.content.match(
        /The module '(.+?)' is included in the Pyodide distribution, but it is not installed./
      );
      if (missing) {
        const missingList = [missing[1]];
        const installed = props.content.match(
          /PythonSponge successfully installed package '(.+?)'/
        );
        if (installed) {
          setMissingDeps(missingList.filter((d) => d !== installed[1]));
        } else {
          setMissingDeps(missingList);
        }
      }
    } else {
      setHasError(false);
      setMissingDeps([]);
    }
  }, [props]);

  const handleInstallDeps = () => {
    if (missingDeps.length > 0) {
      challengeContext?.actions["install-dependencies"](missingDeps);
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      {hasError && ( // make this float
        <div style={{ position: "absolute", top: 5, right: 5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {missingDeps.length > 0 ? (
              <Button
                variant="contained"
                color="warning"
                onClick={handleInstallDeps}
              >
                Install {missingDeps.join(", ")}
              </Button>
            ) : (
              <ErrorIcon color="error" />
            )}
          </Stack>
        </div>
      )}
      <Console
        content={props.content}
        isInputEnabled={props.inputEnabled}
        onInput={(input) => {
          challengeContext?.actions["input-entered"](input);
        }}
        onInterrupt={() => challengeContext?.actions["kill"]()}
      />
    </Box>
  );
};

export default ChallengeConsole;
