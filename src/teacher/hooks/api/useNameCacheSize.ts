import { useOutletContext } from "react-router-dom";
import { OutletContextType } from "../../../auth/AdminWrapper";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useContext } from "react";
import SessionContext from "../../../auth/contexts/SessionContext";

export const useNameCacheSize = (
  options?: UseQueryOptions<number, Error, number, readonly ["nameCacheSize"]>
) => {
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  return useQuery<number, Error, number, readonly ["nameCacheSize"]>({
    queryKey: ["nameCacheSize"],
    queryFn: async () => {
      const res = await fetch(`${urlBase}/api/admin/cache/name`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch name cache size");
      }
      const data = await res.json();
      if (!data) {
        throw new Error("Failed to fetch name cache size: no data");
      }
      return data?.data?.["cache-size"] ?? 0;
    },
    ...options,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    enabled: !!urlBase && !!token,
  });
};
