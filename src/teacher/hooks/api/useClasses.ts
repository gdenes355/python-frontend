import { useQuery } from "@tanstack/react-query";
import SessionContext from "../../../auth/contexts/SessionContext";
import { OutletContextType } from "../../../auth/AdminWrapper";
import { useOutletContext } from "react-router-dom";
import { useContext } from "react";
import { ClassModel } from "../../Models";

export const useClasses = () => {
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  return useQuery<ClassModel[], Error>({
    queryKey: ["classes"],
    queryFn: async () => {
      const resp = await fetch(`${urlBase}/api/admin/classes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) {
        throw new Error(
          `Failed to fetch classes: ${resp.status} ${resp.statusText}`
        );
      }
      return (await resp.json())["data"] as ClassModel[];
    },
    enabled: !!urlBase && !!token,
  });
};
