import { useCallback } from "react";

const useFileDownloader = () => {
  const downloadFile = useCallback((file: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);
  return { download: downloadFile };
};

export default useFileDownloader;
