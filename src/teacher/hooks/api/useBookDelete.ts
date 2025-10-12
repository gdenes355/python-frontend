import { useContext } from "react";
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { OutletContextType } from "../../../auth/AdminWrapper";
import SessionContext from "../../../auth/contexts/SessionContext";
import { useOutletContext } from "react-router-dom";

export const useBookDelete = (
  options: UseMutationOptions<void, Error, string>
) => {
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (bookPath: string) => {
      if (!bookPath) throw new Error("Path is required");
      const safePath = encodeURIComponent(bookPath);
      const url = `${urlBase}/api/admin/books/${safePath}`;
      const resp = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) {
        throw new Error(
          `Failed to delete book: ${resp.status} ${resp.statusText}`
        );
      }
    },
    ...options,
    onSuccess: (...rest) => {
      queryClient.invalidateQueries({ queryKey: ["bookList"] });
      options.onSuccess?.(...rest);
    },
  });
};
