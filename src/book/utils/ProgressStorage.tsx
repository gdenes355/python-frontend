import { useContext, useEffect, useState } from "react";
import SessionContext from "../../auth/SessionContext";
import BookNodeModel from "../../models/BookNodeModel";
import { AllTestResults } from "../../models/Tests";
import { throttle } from "lodash";
import {
  ChallengeResultComplexModel,
  ResultsModel,
} from "../../teacher/Models";

const loadTestStateLocal: (node: BookNodeModel) => AllTestResults = (node) => {
  let passPath = encodeURIComponent(node.bookMainUrl + "-testsPassing");
  let failPath = encodeURIComponent(node.bookMainUrl + "-testsFailing");

  let cacheP = localStorage.getItem(passPath);
  let cacheF = localStorage.getItem(failPath);

  let cachedPass = cacheP ? JSON.parse(cacheP) : [];
  let cachedFail = cacheF ? JSON.parse(cacheF) : [];

  return { passed: new Set(cachedPass), failed: new Set(cachedFail) };
};

const saveTestStateLocal: (
  node: BookNodeModel,
  pass: boolean | null
) => void = (node, pass) => {
  let passPath = encodeURIComponent(node.bookMainUrl + "-testsPassing");
  let failPath = encodeURIComponent(node.bookMainUrl + "-testsFailing");

  let cacheP = localStorage.getItem(passPath);
  let cacheF = localStorage.getItem(failPath);

  let cachedPass = cacheP ? JSON.parse(cacheP) : [];
  let cachedFail = cacheF ? JSON.parse(cacheF) : [];
  if (pass === true) {
    if (cachedPass.indexOf(node.id) !== -1) {
      // already stored in pass
      return;
    } else {
      cachedPass.push(node.id);
    }

    let index = cachedFail.indexOf(node.id);
    if (index !== -1) {
      cachedFail.splice(index, 1);
    }
  } else if (pass === false) {
    if (cachedFail.indexOf(node.id) !== -1) {
      // already stored in fail
      return;
    } else {
      cachedFail.push(node.id);
    }

    let index = cachedPass.indexOf(node.id);
    if (index !== -1) {
      cachedPass.splice(index, 1);
    }
  } else {
    return;
  }
  localStorage.setItem(passPath, JSON.stringify([...cachedPass]));
  localStorage.setItem(failPath, JSON.stringify([...cachedFail]));
};

type ProgressStorage = {
  allTestResults: AllTestResults;
  setResult: (
    challenge: BookNodeModel,
    outcome?: boolean,
    code?: string
  ) => void;
  getResult: (challenge: BookNodeModel) => boolean | undefined;
  updateResults: (newResults: AllTestResults) => void;
  fetchResults: (root: BookNodeModel, currentRes: AllTestResults) => void;
};

const useProgressStorage: (bookPath: string) => ProgressStorage = (
  bookPath
) => {
  const sessionContext = useContext(SessionContext);

  const [allTestResults, setAllTestResults] = useState<AllTestResults>({
    passed: new Set(),
    failed: new Set(),
  });

  const persistInMemory = (challenge: BookNodeModel, outcome: boolean) => {
    if (outcome === true) {
      allTestResults.passed.add(challenge.id);
      allTestResults.failed.delete(challenge.id);
    } else if (outcome === false) {
      allTestResults.passed.delete(challenge.id);
      allTestResults.failed.add(challenge.id);
    }
    setAllTestResults(allTestResults); // trigger update
  };

  const persistInServer = throttle(
    (challenge: BookNodeModel, outcome?: boolean, code?: string) => {
      if (!sessionContext.isLoggedIn()) return;

      code = code?.trimEnd();
      // if code is too long, trim it to 4000 characters
      if (code && code.length > 4000) {
        code = code.substring(0, 4000);
      }

      // check for ws
      if (sessionContext.wsOpen && sessionContext.wsSend) {
        sessionContext.wsSend({
          cmd: "set-result",
          id: challenge.id,
          outcome,
          code,
        });
        return;
      }

      // fall back to REST if available
      if (sessionContext.resultsEndpoint) {
        fetch(sessionContext.resultsEndpoint, {
          method: "POST",
          cache: "no-cache",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionContext.token}`,
          },
          body: JSON.stringify({
            book: bookPath,
            id: challenge.id,
            outcome,
            code,
          }),
        }).then((response) => {
          if (response.status === 401) {
            response.json().then((data) => {
              sessionContext.login({
                clientId: data.clientId,
                tenantId: data.tenantId || "common",
                jwtEndpoint: data.jwtEndpoint,
                startUrl: window.location.href,
                resultsEndpoint: data.resultsEndpoint,
                wsEndPoint: data.wsEndPoint,
                bookPath: bookPath,
              });
            });
          }
        });
      }
    },
    3000
  );

  useEffect(() => {
    setAllTestResults({ passed: new Set(), failed: new Set() });
  }, [bookPath]);

  const setResult = (
    challenge: BookNodeModel,
    outcome?: boolean,
    code?: string
  ) => {
    if (outcome === null || outcome === undefined) {
      //ignore
      return;
    }
    persistInMemory(challenge, outcome);
    saveTestStateLocal(challenge, outcome); // persist in local storage
    persistInServer(challenge, outcome, code); // push to server
  };

  const getResult = (challenge: BookNodeModel) => {
    if (allTestResults.passed.has(challenge.id)) {
      return true;
    }
    if (allTestResults.failed.has(challenge.id)) {
      return false;
    }
    return undefined;
  };

  const updateResults = (newResults: AllTestResults) => {
    // let's be optimistic and take all new passes
    allTestResults.passed = new Set([
      ...allTestResults.passed,
      ...newResults.passed,
    ]);
    allTestResults.failed = new Set(
      [...allTestResults.failed, ...newResults.failed].filter(
        (x) => !allTestResults.passed.has(x)
      )
    );
    setAllTestResults(allTestResults);
  };

  const mergeResults = (
    node: BookNodeModel,
    newResults: ResultsModel,
    currentRes: AllTestResults,
    newPasses: Set<string>
  ) => {
    // let's be optimistic and take all new passes
    let res = (newResults as any)[node.id] as ChallengeResultComplexModel;
    if (res && res.correct && !currentRes.passed.has(node.id)) {
      saveTestStateLocal(node, true);
      newPasses.add(node.id);
    }
    if (node.children) {
      for (let child of node.children) {
        mergeResults(child, newResults, currentRes, newPasses);
      }
    }
  };

  const fetchResults = (root: BookNodeModel, currentRes: AllTestResults) => {
    if (sessionContext.isLoggedIn()) {
      if (sessionContext.wsOpen && sessionContext.wsSend) {
        console.log("requesting results from server");
        sessionContext.wsSend(
          {
            cmd: "get-results",
          },
          (msg: any) => {
            // merge results!
            if (msg.res === "succ" && msg.data) {
              let newPasses = new Set<string>();
              mergeResults(root, msg.data, currentRes, newPasses);
              updateResults({
                passed: newPasses,
                failed: new Set(),
              });
            }
          }
        );
      } else if (sessionContext.resultsEndpoint) {
        // TODO: fall back to REST if available
        fetch(
          sessionContext.resultsEndpoint +
            `?book=${encodeURIComponent(bookPath)}`,
          {
            method: "GET",
            cache: "no-cache",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionContext.token}`,
            },
          }
        ).then((response) => {
          if (response.status === 401) {
            response.json().then((data) => {
              sessionContext.login({
                clientId: data.clientId,
                tenantId: data.tenantId || "common",
                jwtEndpoint: data.jwtEndpoint,
                startUrl: window.location.href,
                resultsEndpoint: data.resultsEndpoint,
                wsEndPoint: data.wsEndPoint,
                bookPath: bookPath,
              });
            });
          } else if (response.status === 200) {
            response.json().then((data) => {
              let newPasses = new Set<string>();
              mergeResults(root, data.data, currentRes, newPasses);
              updateResults({
                passed: newPasses,
                failed: new Set(),
              });
            });
          }
        });
      }
    }
  };

  return { setResult, getResult, allTestResults, updateResults, fetchResults };
};

export {
  useProgressStorage,
  loadTestStateLocal,
  saveTestStateLocal,
  ProgressStorage,
};
