import React, { useContext, useEffect, useState } from "react";
import BookNodeModel from "../models/BookNodeModel";
import { Box } from "@mui/material";
import HeaderBar from "../components/HeaderBar";
import Guide from "../components/Guide";
import BookControlFabs from "../book/components/BookControlFabs";
import IBookFetcher from "../book/utils/IBookFetcher";
import SessionContext from "../auth/SessionContext";

type GuideOnlyChallengeProps = {
  guidePath: string;
  openBookDrawer?: (open: boolean) => void;
  onRequestPreviousChallenge?: () => void;
  onRequestNextChallenge?: () => void;
  title?: string;
  bookNode: BookNodeModel;
  fetcher: IBookFetcher;
};

const GuideOnlyChallenge = (props: GuideOnlyChallengeProps) => {
  const [md, setMd] = useState<string | undefined>(undefined);
  const [error, setError] = useState<boolean>(false);
  const sessionContext = useContext(SessionContext);
  useEffect(() => {
    let ac = new AbortController();
    props.fetcher
      .fetch(props.guidePath, sessionContext)
      .then((response) => {
        if (!response.ok) {
          setError(true);
        }
        return response.text();
      })
      .then((text) => {
        if (!ac.signal.aborted) {
          setMd(text);
        }
      })
      .catch((e) => {
        setError(true);
      });
    return () => ac?.abort();
  }, [props.guidePath, props.fetcher, sessionContext]);
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        overflow: "hidden",
        flexDirection: "column",
      }}
      justifyContent="center"
    >
      <HeaderBar title={props.title} />
      <Guide md={error ? "Failed to load guide" : md || "Loading..."} />
      <BookControlFabs
        onNavigateToNextPage={props.onRequestNextChallenge}
        onNavigateToPrevPage={props.onRequestPreviousChallenge}
        onOpenMenu={() => props.openBookDrawer?.(true)}
      />
    </Box>
  );
};

export default GuideOnlyChallenge;
