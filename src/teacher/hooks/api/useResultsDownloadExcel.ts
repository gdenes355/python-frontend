import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { OutletContextType } from "../../../auth/AdminWrapper";
import { useOutletContext } from "react-router-dom";
import SessionContext from "../../../auth/contexts/SessionContext";
import { useContext } from "react";
import { saveAs } from "file-saver";

export const useResultsDownloadExcel = (
  options: UseMutationOptions<Blob, Error, string>
) => {
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  return useMutation<Blob, Error, string>({
    mutationFn: async (className: string) => {
      const resp = await fetch(
        `${urlBase}/api/admin/classes/${className}/results/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!resp.ok) {
        throw new Error(
          `Failed to download results: ${resp.status} ${resp.statusText}`
        );
      }
      const blob = await resp.blob();
      saveAs(blob, `results-${className}.xlsx`);
      return blob;
    },
    ...options,
  });
};
