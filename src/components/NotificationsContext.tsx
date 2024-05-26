import React, { MutableRefObject, useEffect, useRef } from "react";
import { Alert, AlertColor, Snackbar, Stack } from "@mui/material";
import { createContext, useCallback, useState } from "react";

type NotificationType = {
  message: string;
  severity: AlertColor;
};

export type NotificationsContextType = {
  addMessage: MutableRefObject<(message: string, severity: AlertColor) => void>;
};

const defContext: NotificationsContextType = {
  addMessage: {
    current: () => {},
  },
};

const NotificationsContext = createContext(defContext);

type NotificationsWrapperProps = {
  children: React.ReactNode;
};

type NotificationProps = {
  onClosed?: () => void;
} & NotificationType;

const Notification = (props: NotificationProps) => {
  const [open, setOpen] = useState(true);
  const handleClose = () => {
    setOpen(false);
  };
  return (
    <Snackbar open={open} autoHideDuration={2000} onClose={handleClose}>
      <Alert severity={props.severity} onClose={handleClose}>
        {props.message}
      </Alert>
    </Snackbar>
  );
};

const NotificationsWrapper = (props: NotificationsWrapperProps) => {
  const [messages, setMessages] = useState<NotificationType[]>([]);
  const _addMessage = useCallback(
    (message: string, severity: AlertColor) => {
      setMessages([...messages, { message, severity }]);
    },
    [messages]
  );

  const addMessage = useRef(_addMessage);

  useEffect(() => {
    addMessage.current = _addMessage;
  }, [_addMessage]);

  return (
    <NotificationsContext.Provider
      value={{
        addMessage,
      }}
    >
      {props.children}
      <Stack spacing={2} sx={{ width: "100%" }}>
        {messages.map((message, i) => {
          return (
            <Notification
              key={i}
              {...message}
              onClosed={() => {
                const newMessages = [...messages];
                newMessages.splice(i, 1);
                setMessages(newMessages);
              }}
            />
          );
        })}
      </Stack>
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext;
export { NotificationsWrapper };
