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
  newBookNode?: BookNodeModel,
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
    bookNode.additionalFiles?.map((file) => {
      return [
        file,
        displayedAdditionalFiles?.get(file.filename) ||
          currentAdditionalFiles?.[file.filename],
      ];
    })
  );
  updatedFiles.forEach((text, file) => {
    if (text) {
      store.store.save(text, file.filename);
    }
  });

  // update the book
  if (!newBookNode) {
    return false;
  }
  let changed = false;
  if (newBookNode.name && newBookNode.name !== bookNode.name) {
    changed = true;
    bookNode.name = newBookNode.name;
  }
  if (newBookNode.isExample !== bookNode.isExample) {
    changed = true;
    bookNode.isExample = newBookNode.isExample ? true : undefined;
  }
  if (newBookNode.isAssessment !== bookNode.isAssessment) {
    changed = true;
    bookNode.isAssessment = newBookNode.isAssessment ? true : undefined;
  }
  if (newBookNode.typ !== bookNode.typ) {
    changed = true;
    bookNode.typ = newBookNode.typ;
  }
  if (newBookNode.tests !== bookNode.tests) {
    changed = true;
    bookNode.tests = newBookNode.tests;
  }
  if (newBookNode.additionalFiles !== bookNode.additionalFiles) {
    changed = true;
    bookNode.additionalFiles = newBookNode.additionalFiles;
  }
  if (newBookNode.isSessionFilesAllowed !== bookNode.isSessionFilesAllowed) {
    changed = true;
    bookNode.isSessionFilesAllowed = newBookNode.isSessionFilesAllowed
      ? true
      : undefined;
  }
  if (changed) {
    store.store.saveBook();
  }

  return changed;
};

export default saveNode;
