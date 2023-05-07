import React, { useContext } from "react";
import SessionContext from "../SessionContext";
import PowerIcon from "@mui/icons-material/Power";
import { Tooltip } from "@mui/material";

const SessionWsStateIndicator = () => {
  const sessionContext = useContext(SessionContext);

  const ws = sessionContext.wsOpen && sessionContext.wsSend;
  const http = !!sessionContext.resultsEndpoint;

  return (
    <Tooltip
      title={
        ws
          ? "WebSocket connection with server is active"
          : http
          ? "Websocket closed. Your progress is saved through HTTP requests"
          : "No connection with server. Your progress is not saved"
      }
    >
      <PowerIcon
        sx={{ margin: 1 }}
        color={ws ? "success" : http ? "warning" : "error"}
      />
    </Tooltip>
  );
};

export default SessionWsStateIndicator;
