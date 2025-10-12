import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import SessionContext from "../../../auth/contexts/SessionContext";
import { OutletContextType } from "../../../auth/AdminWrapper";
import { useOutletContext } from "react-router-dom";
import { useContext } from "react";
import { ClassModel } from "../../Models";

export const useClassesAddBook = (
  options: UseMutationOptions<void, Error, { className: string; book: string }>
) => {
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  const queryClient = useQueryClient();

  return useMutation<void, Error, { className: string; book: string }>({
    mutationFn: async ({
      className,
      book,
    }: {
      className: string;
      book: string;
    }) => {
      if (!className || !book)
        throw new Error("ClassName and book are required");
      const resp = await fetch(
        `${urlBase}/api/admin/classes/${className}/books`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ book }),
        }
      );
      if (!resp.ok) {
        throw new Error(
          `Failed to add book to class: ${resp.status} ${resp.statusText}`
        );
      }
      await resp.json();
    },
    ...options,
    onSuccess: (
      data,
      { className, book }: { className: string; book: string },
      ...rest
    ) => {
      queryClient.setQueryData(["classes"], (old: ClassModel[]) => {
        return old.map((c) =>
          c.name === className ? { ...c, books: [...(c.books || []), book] } : c
        );
      });
      options.onSuccess?.(data, { className, book }, ...rest);
    },
  });
};
