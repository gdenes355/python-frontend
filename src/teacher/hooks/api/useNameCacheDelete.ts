import { useOutletContext } from "react-router-dom";
import { OutletContextType } from "../../../auth/AdminWrapper";
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { useContext } from "react";
import SessionContext from "../../../auth/contexts/SessionContext";

export const useNameCacheDelete = (
  options: UseMutationOptions<void, Error>
) => {
  const queryClient = useQueryClient();
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  return useMutation<void, Error>({
    mutationFn: async () => {
      const res = await fetch(`${urlBase}/api/admin/cache/name`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete name cache");
      }
    },
    ...options,
    onSuccess: (...rest) => {
      queryClient.invalidateQueries({ queryKey: ["nameCacheSize"] });
      options.onSuccess?.(...rest);
    },
  });
};
