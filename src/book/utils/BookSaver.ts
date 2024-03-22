import { AdditionalFilesContents } from "../../models/AdditionalFiles";
import BookNodeModel from "../../models/BookNodeModel";
import { IEditableBookStore } from "./EditableBookStore";

// save code/guide/json to the store
// update bookNode fields in place if necessary
// return true if the bookNode has changed
const saveNode = (
  bookNode: BookNodeModel,
  store?: IEditableBookStore,
  code?: string,
  guideMd?: string,
  json?: string,
  currentAdditionalFiles?: AdditionalFilesContents,
  displayedAdditionalFiles?: Map<string, string>
) => {
  if (!store) return;

  // saving the code is easy
  // assume that the .py path hasn't changed, just the content
  store.store.save(code || "", bookNode.py!);

  // saving the guide is also easy
  store.store.save(guideMd || "", bookNode.guide!);

  // saving the additional files or solution files
  let updatedFiles = new Map(
    bookNode.additionalFiles?.map((file, index) => {
      return [
        file,
        displayedAdditionalFiles?.get(file.filename) ||
          currentAdditionalFiles?.[file.filename],
      ];
    })
  );
  updatedFiles.forEach((text, file) => {
    if (text) {
      console.log(file.filename, text);
      store.store.save(text, file.filename);
    }
  });

  // update the book from json
  let changed = false;
  let editedNode = JSON.parse(json || "") as BookNodeModel;
  if (editedNode.name && editedNode.name !== bookNode.name) {
    changed = true;
    bookNode.name = editedNode.name;
  }
  if (editedNode.isExample !== bookNode.isExample) {
    changed = true;
    bookNode.isExample = editedNode.isExample;
  }
  if (editedNode.isAssessment !== bookNode.isAssessment) {
    changed = true;
    bookNode.isAssessment = editedNode.isAssessment;
  }
  if (editedNode.typ !== bookNode.typ) {
    changed = true;
    bookNode.typ = editedNode.typ;
  }
  if (editedNode.tests !== bookNode.tests) {
    changed = true;
    bookNode.tests = editedNode.tests;
  }
  if (editedNode.additionalFiles !== bookNode.additionalFiles) {
    changed = true;
    bookNode.additionalFiles = editedNode.additionalFiles;
  }
  if (changed) {
    store.store.saveBook();
  }

  return changed;
};

export default saveNode;
