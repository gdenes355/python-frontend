import { useContext } from "react";
import { OutletContextType } from "../../../auth/AdminWrapper";
import SessionContext from "../../../auth/contexts/SessionContext";
import { useOutletContext } from "react-router-dom";
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";

export const useBookVersionUpload = (
  bookPath?: string,
  options: UseMutationOptions<void, Error, File> = {}
) => {
  const { token } = useContext(SessionContext);
  const { urlBase }: OutletContextType = useOutletContext();
  const queryClient = useQueryClient();

  return useMutation<void, Error, File>({
    mutationFn: async (file: File) => {
      if (!bookPath) throw new Error("Path is required");
      const safePath = encodeURIComponent(bookPath);
      const url = `${urlBase}/api/admin/books/${safePath}/history/new`;
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch(url, {
        method: "POST",
        body: form,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        throw new Error(
          `Failed to upload book version: ${resp.status} ${resp.statusText}`
        );
      }
    },
    ...options,
    onSuccess: (...rest) => {
      queryClient.invalidateQueries({ queryKey: ["bookHistory", bookPath] });
      options.onSuccess?.(...rest);
    },
  });
};
