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

export const useClassesStudentsDelete = (
  options: UseMutationOptions<
    void,
    Error,
    { className: string; student: string }
  >
) => {
  const queryClient = useQueryClient();
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  return useMutation<void, Error, { className: string; student: string }>({
    mutationFn: async ({
      className,
      student,
    }: {
      className: string;
      student: string;
    }) => {
      if (!className || !student)
        throw new Error("className and student are required");
      const resp = await fetch(
        `${urlBase}/api/admin/classes/${className}/students/${student}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          method: "DELETE",
        }
      );
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
            ? {
                ...c,
                students: (c.students || []).filter(
                  (s) => s !== variables.student
                ),
              }
            : c
        );
      });
      options.onSuccess?.(data, variables, context, ...rest);
    },
  });
};
