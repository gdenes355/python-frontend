import { TestCases } from "./Tests";
import { AdditionalFiles } from "./AdditionalFiles";

type Solution = {
  file: string;
  showSolution?: number | boolean;
};

type BookNodeModel = {
  name: string;
  id: string;
  children?: BookNodeModel[];
  py?: string;
  guide?: string;
  tests: TestCases;
  additionalFiles?: AdditionalFiles;
  bookLink?: string;
  isExample?: boolean;
  isAssessment?: boolean;
  isLong?: boolean;
  typ?: "py" | "parsons" | "canvas";
  sol?: Solution;

  // cached
  // what is the main URL of this book (md, py and bookLinks are relative to this)
  bookMainUrl?: string;
};

const getSinglePage: (root: BookNodeModel) => BookNodeModel | null = (root) => {
  let node = root;
  while (true) {
    if (node.children && node.children.length === 1) {
      node = node.children[0];
    } else if (!node.children || node.children.length === 0) {
      return node;
    } else {
      return null;
    }
  }
};

const findBookNode: (
  node: BookNodeModel,
  id: String
) => BookNodeModel | null = (node, id) => {
  if (node.id === id) {
    return node;
  }
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      let res = findBookNode(node.children[i], id);
      if (res) {
        return res;
      }
    }
  }
  return null;
};

const findParent: (
  root: BookNodeModel,
  child: BookNodeModel
) => BookNodeModel | null = (root, child) => {
  let workingStack: Array<BookNodeModel> = [root];
  while (workingStack.length > 0) {
    let node = workingStack.pop();
    if (node?.children && node.children.length > 0) {
      if (node.children.includes(child)) {
        return node;
      }

      workingStack.push(...node.children);
    }
  }
  return null;
};

const nextBookNode: (
  root: BookNodeModel,
  currentId: string,
  nodeFilter?: (node: BookNodeModel) => boolean
) => BookNodeModel = (root, currentId, nodeFilter) => {
  let currentSeen = false;
  let workingStack: Array<BookNodeModel> = [root];
  while (workingStack.length > 0) {
    let currentNode = workingStack.pop();
    if (currentNode && currentSeen) {
      // we have seen the current node already, so if it passes the filter, then let's just return this node
      if (!nodeFilter || nodeFilter(currentNode)) {
        return currentNode;
      }
    }
    if (currentNode?.id === currentId) {
      // just found the current node
      currentSeen = true;
    }
    if (currentNode?.children) {
      for (let i = currentNode.children.length - 1; i >= 0; i--) {
        workingStack.push(currentNode.children[i]);
      }
    }
  }
  // no node found
  return root;
};

const prevBookNode: (
  root: BookNodeModel,
  currentId: string,
  nodeFilter?: (node: BookNodeModel) => boolean
) => BookNodeModel = (root, currentId, nodeFilter) => {
  let lastGoodNode = root;
  let workingStack: Array<BookNodeModel> = [root];
  while (workingStack.length > 0) {
    let currentNode = workingStack.pop();
    if (currentNode?.id === currentId) {
      // just found the current node
      return lastGoodNode;
    }
    if (currentNode && (!nodeFilter || nodeFilter(currentNode))) {
      lastGoodNode = currentNode;
    }
    if (currentNode?.children) {
      for (let i = currentNode.children.length - 1; i >= 0; i--) {
        workingStack.push(currentNode.children[i]);
      }
    }
  }
  // no node found
  return root;
};

const deleteBookNode: (root: BookNodeModel, toDelete: BookNodeModel) => void = (
  root,
  toDelete
) => {
  let workingStack: Array<BookNodeModel> = [root];
  if (toDelete === root) {
    // root node cannot be deleted
    return;
  }
  while (workingStack.length > 0) {
    let currentNode = workingStack.pop();
    if (currentNode?.children && currentNode.children.length > 0) {
      // has children
      if (currentNode.children.includes(toDelete)) {
        currentNode.children.splice(currentNode.children.indexOf(toDelete), 1);
        return; // deleted
      }
      workingStack.push(...currentNode.children);
    }
  }
};

type NodeParentPair = {
  node: BookNodeModel;
  parent?: BookNodeModel;
};

const promoteBookNode: (
  root: BookNodeModel,
  toPromote: BookNodeModel
) => void = (root, toPromote) => {
  let workingStack: Array<NodeParentPair> = [{ node: root, parent: undefined }];
  while (workingStack.length > 0) {
    let curr = workingStack.pop();
    if (!curr) continue;
    let { node, parent } = curr;
    if (node.children && node.children.length > 0) {
      if (node.children.includes(toPromote)) {
        if (parent) {
          parent.children?.splice(parent.children?.indexOf(node), 0, toPromote);
          node.children.splice(node.children.indexOf(toPromote), 1);
        }
        return;
      }
      for (let child of node.children) {
        workingStack.push({ node: child, parent: node });
      }
    }
  }
};

const demoteBookNode: (root: BookNodeModel, toDemote: BookNodeModel) => void = (
  root,
  toDemote
) => {
  let workingStack: Array<BookNodeModel> = [root];
  if (toDemote === root) {
    // root node cannot be demoted
    return;
  }
  while (workingStack.length > 0) {
    let node = workingStack.pop();
    if (node?.children && node.children.length > 0) {
      // has children
      if (node.children.includes(toDemote)) {
        // see if we can demote this under the index before toDemote
        let removeIdx = node.children.indexOf(toDemote);
        if (removeIdx > 0) {
          let parentCandidate = node.children[removeIdx - 1];
          if (!parentCandidate.children) {
            parentCandidate.children = [toDemote];
          } else {
            parentCandidate.children.push(toDemote);
          }
          node.children.splice(removeIdx, 1);
        }
        return; // finished
      }
      workingStack.push(...node.children);
    }
  }
};

const moveBookNodeAfter = (
  root: BookNodeModel,
  from: BookNodeModel,
  to: BookNodeModel
) => {
  if (!from || !to || from === to) {
    return;
  }
  let fromParent = findParent(root, from);
  let toParent = findParent(root, to);
  if (!fromParent || !toParent || !fromParent.children || !toParent.children) {
    return;
  }
  fromParent.children.splice(fromParent.children.indexOf(from), 1);
  toParent.children.splice(toParent.children.indexOf(to) + 1, 0, from);
};

const _extractIds = (node: BookNodeModel, dict: Map<string, BookNodeModel>) => {
  dict.set(node.id, node);
  if (node.children) {
    for (let child of node.children) {
      _extractIds(child, dict);
    }
  }
};

const extractIds = (node: BookNodeModel) => {
  let map: Map<string, BookNodeModel> = new Map();
  _extractIds(node, map);
  return map;
};

const _extractIdsWithTestsInOrder = (
  node: BookNodeModel,
  arr: Array<string>
) => {
  if (
    node.isExample ||
    node.tests ||
    node.typ === "parsons" ||
    (node.isAssessment && node.py)
  )
    arr.push(node.id);
  if (node.children) {
    for (let child of node.children) {
      _extractIdsWithTestsInOrder(child, arr);
    }
  }
};

const extractIdsWithTestsInOrder = (node: BookNodeModel) => {
  let arr: Array<string> = [];
  _extractIdsWithTestsInOrder(node, arr);
  return arr;
};

const _extractFileNames = (node: BookNodeModel, arr: Array<string>) => {
  if (node.py) arr.push(node.py);
  if (node.guide) arr.push(node.guide);
  if (node.children) {
    for (let child of node.children) {
      _extractFileNames(child, arr);
    }
  }
};

const extractFileNames = (node: BookNodeModel) => {
  let arr: Array<string> = [];
  _extractFileNames(node, arr);
  return arr;
};

export default BookNodeModel;
export {
  findBookNode,
  nextBookNode,
  prevBookNode,
  extractIds,
  extractIdsWithTestsInOrder,
  deleteBookNode,
  promoteBookNode,
  demoteBookNode,
  findParent,
  moveBookNodeAfter,
  getSinglePage,
  extractFileNames,
};
