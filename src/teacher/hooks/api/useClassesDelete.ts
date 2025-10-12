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

export const useClassesDelete = (
  options: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  return useMutation<void, Error, string>({
    mutationFn: async (className: string) => {
      const resp = await fetch(`${urlBase}/api/admin/classes/${className}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "DELETE",
      });
      if (!resp.ok) {
        throw new Error(
          `Failed to delete class: ${resp.status} ${resp.statusText}`
        );
      }
      await resp.json();
    },
    ...options,
    onSuccess: (data, variables, context, ...rest) => {
      queryClient.setQueryData(["classes"], (old: ClassModel[]) => {
        return old.filter((c) => c.name !== variables);
      });
      options.onSuccess?.(data, variables, context, ...rest);
    },
  });
};
