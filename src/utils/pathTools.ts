const absoluteRegex = new RegExp("^(?:[a-z]+:)?//", "i");

function isAbsoluteAddress(path: string) {
  return absoluteRegex.test(path);
}

function absolutisePath(filePath: string, rootPath: string | URL) {
  // if filepath is a relative path, then transform it to an absolute path using bookPath
  if (absoluteRegex.test(filePath)) {
    return filePath;
  } else {
    return new URL(filePath, rootPath).toString();
  }
}

function splitToParts(path: string) {
  let parts = path.split("/");
  return parts.filter((x) => x !== "." && x);
}

export { isAbsoluteAddress, absolutisePath, splitToParts };
