namespace ZipPathTransformer {
  export const transformZipPath = (path: string | null) => {
    if (!path) {
      return path;
    }
    if (path.startsWith("https://drive.google.com/file/d/")) {
      // this is a Google Drive link, which is unlikely to work naively
      // try to transform into a Google Drive API request
      let r = /https:\/\/drive\.google\.com\/file\/d\/([^/]*)/;
      let res = r.exec(path);
      if (res && res.length === 2) {
        path = `https://www.googleapis.com/drive/v3/files/${res[1]}?key=AIzaSyAJpByDGxEyz1M36nTURm9ECCoatGfvZaM&alt=media`;
      }
    }
    return path;
  };
}

export default ZipPathTransformer;
