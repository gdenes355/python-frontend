import { useCallback, useContext, useEffect, useRef, useState } from "react";
import IBookFetcher from "../../book/utils/IBookFetcher";

import ChallengeTypes from "../../models/ChallengeTypes";
import SessionContext, {
  SessionContextType,
} from "../../auth/contexts/SessionContext";
import {
  AdditionalFiles,
  AdditionalFilesContents,
} from "../../models/AdditionalFiles";
import { absolutisePath } from "../../utils/pathTools";
import EditableBookStore from "../../book/utils/EditableBookStore";
import { Solution } from "../../models/BookNodeModel";

type HookProps = {
  guidePath: string;
  codePath: string;
  additionalFiles: AdditionalFiles;
  typ: ChallengeTypes;
  uid: string;
  solution?: Solution;
  fetcher: IBookFetcher;
  store: EditableBookStore | null;

  isEditing?: boolean;
};

const useChallengeLoader = (props: HookProps) => {
  const [guideMd, setGuideMd] = useState<string>(
    "*Loading the guide... Please wait*"
  );
  const [isLoadingGuide, setIsLoadingGuide] = useState<boolean>(true);
  const [starterCode, setStarterCode] = useState<string | undefined>(undefined);
  const [savedCode, setSavedCode] = useState<string | undefined>(undefined);
  const [isLoadingCode, setIsLoadingCode] = useState<boolean>(true);
  const [additionalFilesLoaded, setAdditionalFilesLoaded] =
    useState<AdditionalFilesContents>({});
  const [solutionFile, setSolutionFile] = useState<string | undefined>(
    undefined
  );

  const authContext = useContext(SessionContext);
  const authContextRef = useRef<SessionContextType>(authContext);
  const additionalFilesLoadedRef = useRef<AdditionalFilesContents>({});

  const codePathRef = useRef<string>(props.codePath);
  const guidePathRef = useRef<string>(props.guidePath);

  useEffect(() => {
    authContextRef.current = authContext;
  }, [authContext]);

  useEffect(() => {
    codePathRef.current = props.codePath;
    guidePathRef.current = props.guidePath;
  }, [props.codePath, props.guidePath]);

  const [reloadCtr, setReloadCtr] = useState<number>(0);
  const forceReload = useCallback(() => {
    forceReloadReplacesCode.current = true;
    additionalFilesLoadedRef.current = {}; // flush additional files cache
    setReloadCtr((ctr) => ctr + 1);
  }, []);
  const forceReloadReplacesCode = useRef<boolean>(false);

  // GUIDE
  const fetchGuide = async (
    path: string,
    authContext: SessionContextType,
    fetcher: IBookFetcher
  ) => {
    let resp = await fetcher.fetch(path, authContext);
    if (resp.ok) {
      return { guide: await resp.text(), guidePath: path };
    }
    return { guide: "Failed to load guide", guidePath: path };
  };

  useEffect(() => {
    setIsLoadingGuide(true);
    setGuideMd("Loading");
    fetchGuide(props.guidePath, authContextRef.current, props.fetcher).then(
      ({ guide, guidePath }) => {
        if (guidePath === guidePathRef.current) {
          setGuideMd(guide);
          setIsLoadingGuide(false);
        }
      }
    );
  }, [props.guidePath, props.fetcher, reloadCtr]);

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
    return { code: text, codePath };
  };

  useEffect(() => {
    setSavedCode(
      props.isEditing ? undefined : loadSavedCode(props.uid, props.typ)
    );
  }, [props.uid, props.typ, props.isEditing]);

  useEffect(() => {
    setIsLoadingCode(true);
    fetchCode(props.codePath, authContextRef.current, props.fetcher).then(
      ({ code, codePath }) => {
        if (codePath === codePathRef.current) {
          setIsLoadingCode(false);
          setStarterCode(code);
          if (forceReloadReplacesCode.current) {
            setSavedCode(code);
          }
        }
        forceReloadReplacesCode.current = false;
      }
    );
  }, [props.codePath, props.fetcher, reloadCtr]);

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
  }, [
    props.additionalFiles,
    authContext,
    props.fetcher,
    props.store,
    reloadCtr,
  ]);

  // solution file
  const fetchSolutionFile = async (
    solutionPath: string,
    authContext: SessionContextType,
    fetcher: IBookFetcher
  ) => {
    let resp = await fetcher.fetch(solutionPath, authContext);
    if (!resp.ok) {
      throw Error("Failed to load solution file");
    }
    let text = await resp.text();
    return { solution: text, solutionPath };
  };

  useEffect(() => {
    if (props.solution?.file) {
      fetchSolutionFile(
        props.solution.file,
        authContextRef.current,
        props.fetcher
      ).then(({ solution, solutionPath }) => {
        if (solutionPath === props.solution?.file) {
          setSolutionFile(solution);
        }
      });
    } else {
      setSolutionFile(undefined);
    }
  }, [props.solution?.file, props.fetcher, reloadCtr]);

  return {
    guideMd,
    savedCode,
    starterCode,
    additionalFilesLoaded,
    solutionFile,
    forceReload,
    isLoadingGuide,
    isLoadingCode,
  };
};

export default useChallengeLoader;
