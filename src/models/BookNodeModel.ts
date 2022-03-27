import { TestCases } from "./Tests";

type BookNodeModel = {
  name: string;
  id: string;
  children?: BookNodeModel[];
  py?: string;
  guide?: string;
  tests: TestCases;
  bookLink?: string;
  isExample?: boolean;

  // cached
  // what is the main URL of this book (md, py and bookLinks are relative to this)
  bookMainUrl?: string;
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

export default BookNodeModel;
export { findBookNode, nextBookNode, prevBookNode };
