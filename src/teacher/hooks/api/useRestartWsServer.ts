import { useContext } from "react";
import SessionContext from "../../../auth/contexts/SessionContext";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { OutletContextType } from "../../../auth/AdminWrapper";
import { useOutletContext } from "react-router-dom";

const useRestartWsServer = (options: UseMutationOptions<void, Error>) => {
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  return useMutation<void, Error>({
    mutationFn: async () => {
      const res = await fetch(`${urlBase}/api/admin/restart-ws`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "POST",
      });
    },
    ...options,
  });
};

export default useRestartWsServer;
