import { useMemo } from "react";
import useBookList from "./api/useBookList";

export type BookTreeNodeModel = {
  name: string;
  children?: BookTreeNodeModel[];
  fullPath: string;
  isLeaf: boolean;
};

const addChildNode = (
  node: BookTreeNodeModel,
  book: string,
  bookRelative: string,
  nodeMap: Map<string, BookTreeNodeModel> // built so far
) => {
  if (!bookRelative) {
    return;
  }
  if (node.children === undefined) {
    node.children = [];
  }
  let name = bookRelative;
  if (name.startsWith(node.name)) {
    name = name.substring(node.name.length);
  }
  if (name.startsWith("/")) {
    name = name.substring(1);
  }
  const parts = name.split("/");
  if (parts.length <= 2) {
    const newNode: BookTreeNodeModel = {
      name: name,
      fullPath: `${window.location.origin}?bk=${book}`,
      isLeaf: true,
    };
    node.children.push(newNode);
    nodeMap.set(newNode.fullPath, newNode);
  } else {
    const part = parts[0];
    let childNode = node.children.find((child) => child.name === part);
    if (childNode === undefined) {
      childNode = {
        name: part,
        children: [],
        fullPath: `${node.fullPath}/${part}`,
        isLeaf: false,
      };
      node.children.push(childNode);
      nodeMap.set(childNode.fullPath, childNode);
    }
    addChildNode(childNode, book, name, nodeMap);
  }
};

const useBookTree = () => {
  const {
    data: books,
    isLoading: isLoadingBooks,
    isError: isErrorBooks,
  } = useBookList();
  const data = useMemo(() => {
    if (!books) {
      return {
        bookTree: undefined,
        nodeMap: new Map<string, BookTreeNodeModel>(),
      };
    }

    const root: BookTreeNodeModel = {
      name: "books",
      children: [],
      isLeaf: false,
      fullPath: window.location.origin + "?bk=books",
    };
    const nodeMap = new Map<string, BookTreeNodeModel>();
    nodeMap.set(root.fullPath, root);
    for (const book of books) {
      addChildNode(root, book, book, nodeMap);
    }
    return {
      bookTree: root,
      nodeMap,
    };
  }, [books]);

  return {
    bookPathList: books,
    bookTree: data.bookTree,
    nodeMap: data.nodeMap,
    isLoading: isLoadingBooks,
    isError: isErrorBooks,
  };
};

export default useBookTree;
