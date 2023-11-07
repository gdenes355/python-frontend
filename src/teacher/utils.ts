import BookNodeModel, { extractIds } from "../models/BookNodeModel";
import { ChallengeResultComplexModel, ResultsModel } from "./Models";
import JSZip from "jszip";

const sanitiseSingleEmail = (email: string) => {
  email = email.trim();
  if (email.includes("<") && email.includes(">")) {
    return email.split("<")[1].split(">")[0];
  }
  return email;
};

const sanitisePastedEmails = (emails: string) => {
  // the pasted emails might come from Outlook
  // if it does, sanitise them
  if (emails.includes(";")) {
    return emails
      .split(";")
      .map((email) => sanitiseSingleEmail(email))
      .join("\n");
  }

  // most likely single email
  return emails;
};

type Result = {
  user: string;
  res: ChallengeResultComplexModel;
  name: string;
};

const zipResults = async (results: ResultsModel[], book: BookNodeModel) => {
  let zip = new JSZip();

  let nodes = extractIds(book);
  let userToFolder = new Map<string, string>();

  // make student folders with their submitted code
  for (let node of nodes) {
    if (!node[1].py) continue;
    for (let res of results) {
      let r = (res as any)[node[0]] as ChallengeResultComplexModel;
      let name =
        !res.name || res.user === res.name
          ? res.user
          : `${res.name.replace(" ", "-")}-${res.user}`;
      userToFolder.set(res.user, name);
      let folder = zip.folder(name);
      if (!folder) continue;
      let code =
        (r && (r["correct-code"] || r["wrong-code"])) || "print('blank')";
      folder.file(node[1].py, code);
    }
  }

  let compiledResults = new Map<string, Result[]>();
  for (let node of nodes) {
    if (!node[1].py) continue;
    let nodeResults = results
      .map((res) => {
        let r = (res as any)[node[0]] as any;
        let name = userToFolder.get(res.user) || res.user;
        return { user: res.user, res: r as ChallengeResultComplexModel, name };
      })
      .filter((p) => p.res !== undefined);
    if (nodeResults.length === 0) continue;
    compiledResults.set(node[1].py, nodeResults);
  }
  for (let [py, res] of compiledResults) {
    let merged = res
      .map(
        (r) =>
          `########################################\n# Student ${
            r.name
          }\n# Hand-marked below\n########################################\n${
            r.res["correct-code"] || r.res["wrong-code"] || ""
          }`
      )
      .join("\n");
    zip.file(py, merged);
  }

  let blob = await zip.generateAsync({ type: "blob" });
  return blob;
};

export { sanitisePastedEmails, zipResults };
