import React, { useEffect, useImperativeHandle, useRef } from "react";
import { Alert, AlertColor, Snackbar, Stack } from "@mui/material";
import { createContext, useCallback, useState } from "react";

type NotificationType = {
  message: string;
  severity: AlertColor;
};

export type NotificationsContextType = {
  addMessage: (message: string, severity: AlertColor) => void;
};

const defContext: NotificationsContextType = {
  addMessage: () => {},
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

type NotificationBarRef = {
  addMessage: (message: string, severity: AlertColor) => void;
};

const NotificationBar = React.forwardRef<NotificationBarRef>((props, ref) => {
  const [messages, setMessages] = useState<NotificationType[]>([]);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const addMessage = useCallback((message: string, severity: AlertColor) => {
    setMessages([...messagesRef.current, { message, severity }]);
  }, []);

  useImperativeHandle(ref, () => ({
    addMessage,
  }));

  return (
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
  );
});

const NotificationsWrapper = (props: NotificationsWrapperProps) => {
  const notificationBarRef = useRef<NotificationBarRef>(null);
  const addMessage = useCallback((message: string, severity: AlertColor) => {
    notificationBarRef.current?.addMessage(message, severity);
  }, []);
  return (
    <NotificationsContext.Provider value={{ addMessage }}>
      <NotificationBar ref={notificationBarRef} />
      {props.children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsContext;
export { NotificationsWrapper };
