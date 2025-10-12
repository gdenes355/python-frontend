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

export const useClassesPatchBookActive = (
  options: UseMutationOptions<
    void,
    Error,
    { className: string; book: string; active: boolean }
  >
) => {
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { className: string; book: string; active: boolean }
  >({
    mutationFn: async ({
      className,
      book,
      active,
    }: {
      className: string;
      book: string;
      active: boolean;
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
          body: JSON.stringify({ book, active }),
        }
      );
      if (!resp.ok) {
        throw new Error(
          `Failed to patch book active: ${resp.status} ${resp.statusText}`
        );
      }
      await resp.json();
    },
    ...options,
    onSuccess: (
      data,
      {
        className,
        book,
        active,
      }: { className: string; book: string; active: boolean },
      ...rest
    ) => {
      queryClient.setQueryData(["classes"], (old: ClassModel[]) => {
        if (active) {
          return old.map((c) =>
            c.name === className
              ? {
                  ...c,
                  books: [...(c.books || []).filter((b) => b !== book), book],
                  disabled_books: [
                    ...(c.disabled_books || []).filter((b) => b !== book),
                  ],
                }
              : c
          );
        } else {
          return old.map((c) =>
            c.name === className
              ? {
                  ...c,
                  disabled_books: [
                    ...(c.disabled_books || []).filter((b) => b !== book),
                    book,
                  ],
                  books: [...(c.books || []).filter((b) => b !== book)],
                }
              : c
          );
        }
      });
      options.onSuccess?.(data, { className, book, active }, ...rest);
    },
  });
};
