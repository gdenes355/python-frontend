import { useContext } from "react";
import useFileDownloader from "../useFileDownloader";
import { OutletContextType } from "../../../auth/AdminWrapper";
import SessionContext from "../../../auth/contexts/SessionContext";
import { useOutletContext } from "react-router-dom";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

function extractFilename(contentDisposition?: string | null) {
  if (!contentDisposition) return null;
  // handles: filename=my.zip, filename="my zip.zip", filename*=utf-8''my%20zip.zip (basic support)
  const starMatch = contentDisposition.match(
    /filename\*\s*=\s*([^']*)''([^;]+)/i
  );
  if (starMatch) {
    try {
      return decodeURIComponent(starMatch[2]);
    } catch {
      /* fall through */
    }
  }
  const match = contentDisposition.match(
    /filename\s*=\s*(?:(["'])(.*?)\1|([^;\n]*))/i
  );
  return match ? (match[2] || match[3])?.trim() ?? null : null;
}

export const useBookHistoryDownload = (
  version: string,
  bookPath?: string,
  options: UseMutationOptions<void, Error> = {}
) => {
  const fileDownloader = useFileDownloader();

  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);

  return useMutation<void, Error>({
    mutationFn: async () => {
      if (!bookPath) throw new Error("Path is required");
      const resp = await fetch(
        `${urlBase}/api/admin/books/${encodeURIComponent(
          bookPath
        )}/history/${encodeURIComponent(version)}/download`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          ...options,
        }
      );
      if (!resp.ok) {
        throw new Error(
          `Failed to download book history: ${resp.status} ${resp.statusText}`
        );
      }
      const fileName =
        extractFilename(resp.headers.get("Content-Disposition")) ||
        "download.zip";
      const data = await resp.blob();
      fileDownloader.download(data, fileName);
    },
  });
};
