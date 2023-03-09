import React, { useContext, useEffect, useState } from "react";
import SessionContext from "../SessionContext";
import PowerIcon from "@mui/icons-material/Power";
import { Tooltip } from "@mui/material";

const SessionWsStateIndicator = () => {
  const sessionContext = useContext(SessionContext);

  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    setConnected(sessionContext.wsOpen);
  }, [sessionContext.wsOpen]);

  return (
    <Tooltip
      title={
        connected
          ? "WebSocket connection with server is active"
          : "Websocket closed. Your progress is saved through HTTP requests"
      }
    >
      <PowerIcon sx={{ margin: 1 }} color={connected ? "success" : "warning"} />
    </Tooltip>
  );
};

export default SessionWsStateIndicator;
