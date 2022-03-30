import BookNodeModel from "../models/BookNodeModel";
import { AllTestResults } from "../models/Tests";

const loadTestState: (node: BookNodeModel) => AllTestResults = (node) => {
  let passPath = encodeURIComponent(node.bookMainUrl + "-testsPassing");
  let failPath = encodeURIComponent(node.bookMainUrl + "-testsFailing");

  let cacheP = localStorage.getItem(passPath);
  let cacheF = localStorage.getItem(failPath);

  let cachedPass = cacheP ? JSON.parse(cacheP) : [];
  let cachedFail = cacheF ? JSON.parse(cacheF) : [];

  return { passed: new Set(cachedPass), failed: new Set(cachedFail) };
};

const saveTestState: (node: BookNodeModel, pass: boolean | null) => void = (
  node,
  pass
) => {
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
    /*
    let index = cachedPass.indexOf(node.id);
    if (index !== -1) {
      cachedPass.splice(index, 1);
    }
    index = cachedFail.indexOf(node.id);
    if (index !== -1) {
      cachedFail.splice(index, 1);
    }*/
  }
  localStorage.setItem(passPath, JSON.stringify([...cachedPass]));
  localStorage.setItem(failPath, JSON.stringify([...cachedFail]));
};

export { saveTestState, loadTestState };
