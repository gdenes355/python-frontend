import { useQuery } from "@tanstack/react-query";
import { OutletContextType } from "../../../auth/AdminWrapper";
import { useOutletContext } from "react-router-dom";
import SessionContext from "../../../auth/contexts/SessionContext";
import { useContext } from "react";

const useBookList = () => {
  const { urlBase }: OutletContextType = useOutletContext();
  const { token } = useContext(SessionContext);
  return useQuery<string[], Error>({
    queryKey: ["bookList"],
    queryFn: async () => {
      console.log("fetching book list");
      const resp = await fetch(`${urlBase}/api/admin/books`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) {
        throw new Error(
          `Failed to fetch book list: ${resp.status} ${resp.statusText}`
        );
      }
      return (await resp.json())["data"] as string[];
    },
  });
};

export default useBookList;
