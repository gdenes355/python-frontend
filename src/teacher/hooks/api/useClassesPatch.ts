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

export const useClassesPatch = (
  options: UseMutationOptions<
    void,
    Error,
    { className: string; active: boolean }
  >
) => {
  const queryClient = useQueryClient();
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  return useMutation<void, Error, { className: string; active: boolean }>({
    mutationFn: async ({
      className,
      active,
    }: {
      className: string;
      active: boolean;
    }) => {
      const resp = await fetch(`${urlBase}/api/admin/classes/${className}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "PATCH",
        body: JSON.stringify({ active }),
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
        return old.map((c) =>
          c.name === variables.className
            ? { ...c, active: variables.active }
            : c
        );
      });
      options.onSuccess?.(data, variables, context, ...rest);
    },
  });
};
