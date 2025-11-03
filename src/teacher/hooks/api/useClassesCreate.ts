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

export const useClassesCreate = (
  options: UseMutationOptions<void, Error, { className: string }>
) => {
  const queryClient = useQueryClient();
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  return useMutation<void, Error, { className: string }>({
    mutationFn: async ({ className }: { className: string }) => {
      const resp = await fetch(`${urlBase}/api/admin/classes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ class_name: className }),
      });
      if (!resp.ok) {
        throw new Error(
          `Failed to patch class: ${resp.status} ${resp.statusText}`
        );
      }
      await resp.json();
    },
    ...options,
    onSuccess: (data, variables, context, ...rest) => {
      queryClient.setQueryData(["classes"], (old: ClassModel[]) => {
        return [
          ...old,
          {
            name: variables.className,
            active: true,
            students: [],
            books: [],
            disabled_books: [],
          },
        ];
      });
      options.onSuccess?.(data, variables, context, ...rest);
    },
  });
};
