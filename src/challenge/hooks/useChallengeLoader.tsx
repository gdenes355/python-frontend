import { useContext, useEffect, useRef, useState } from "react";
import IBookFetcher from "../../book/utils/IBookFetcher";

import ChallengeTypes from "../../models/ChallengeTypes";
import SessionContext, { SessionContextType } from "../../auth/SessionContext";
import {
  AdditionalFiles,
  AdditionalFilesContents,
} from "../../models/AdditionalFiles";
import { absolutisePath } from "../../utils/pathTools";
import EditableBookStore from "../../book/utils/EditableBookStore";

type HookProps = {
  guidePath: string;
  codePath: string;
  additionalFiles: AdditionalFiles;
  typ: ChallengeTypes;
  uid: string;
  fetcher: IBookFetcher;
  store: EditableBookStore | null;
};

const useChallengeLoader = (props: HookProps) => {
  const [guideMd, setGuideMd] = useState<string>(
    "*Loading the guide... Please wait*"
  );
  const [starterCode, setStarterCode] = useState<string | undefined>(undefined);
  const [savedCode, setSavedCode] = useState<string | undefined>(undefined);
  const [additionalFilesLoaded, setAdditionalFilesLoaded] =
    useState<AdditionalFilesContents>({});

  const authContext = useContext(SessionContext);

  const additionalFilesLoadedRef = useRef<AdditionalFilesContents>({});

  // GUIDE
  const fetchGuide = async (
    path: string,
    authContext: SessionContextType,
    fetcher: IBookFetcher
  ) => {
    let resp = await fetcher.fetch(path, authContext);
    if (resp.ok) {
      return resp.text();
    }
    return "Failed to load guide";
  };

  useEffect(() => {
    fetchGuide(props.guidePath, authContext, props.fetcher).then((guide) => {
      setGuideMd(guide);
    });
  }, [props.guidePath, props.fetcher, authContext]);

  // CODE
  const loadSavedCode = (uid: string, typ?: ChallengeTypes) => {
    let savedCode = localStorage.getItem("code-" + encodeURIComponent(uid));
    if (typ !== "parsons" && savedCode) {
      return savedCode;
    }
  };

  const fetchCode = async (
    codePath: string,
    authContext: SessionContextType,
    fetcher: IBookFetcher
  ) => {
    let resp = await fetcher.fetch(codePath, authContext);
    if (!resp.ok) {
      throw Error("Failed to load Python code");
    }
    let text = await resp.text();
    setStarterCode(text);
  };

  useEffect(() => {
    setSavedCode(loadSavedCode(props.uid, props.typ));
  }, [props.uid, props.typ]);

  useEffect(() => {
    fetchCode(props.codePath, authContext, props.fetcher);
  }, [props.codePath, authContext, props.fetcher]);

  // additional files
  const fetchAdditionalFiles = async (
    additionalFiles: AdditionalFiles,
    authContext: SessionContextType,
    fetcher: IBookFetcher,
    store: EditableBookStore | null = null
  ) => {
    const files = (additionalFiles || []).map((file) => file.filename);
    for (let fileName of files) {
      if (!(fileName in additionalFilesLoadedRef.current)) {
        let absFileName = absolutisePath(
          fileName,
          fetcher.getBookPathAbsolute()
        );
        let content = "ERROR LOADING FILE; file not available";
        let response = await fetcher.fetch(absFileName, authContext);
        if (!response.ok) {
          // try to make the file
          let newContents = "add new file contents here\n";
          if (store) {
            store.store.save(newContents, `edit://edit/${absFileName}`);
            content = newContents;
          }
        } else {
          content = await response.text();
        }
        additionalFilesLoadedRef.current[fileName] = content;
        setAdditionalFilesLoaded({ ...additionalFilesLoadedRef.current });
      }
    }
  };

  useEffect(() => {
    fetchAdditionalFiles(
      props.additionalFiles,
      authContext,
      props.fetcher,
      props.store
    );
  }, [props.additionalFiles, authContext, props.fetcher, props.store]);

  return {
    guideMd,
    savedCode,
    starterCode,
    additionalFilesLoaded,
  };
};

export default useChallengeLoader;
