import { useContext } from "react";
import { BookHistory } from "../../../models/BookHistory";
import { OutletContextType } from "../../../auth/AdminWrapper";
import { useOutletContext } from "react-router-dom";
import SessionContext from "../../../auth/contexts/SessionContext";
import { useQuery } from "@tanstack/react-query";

const fetchBookHistory = async (
  urlBase: string,
  token: string,
  bookPath?: string
) => {
  if (!bookPath) return null;
  const bookPathUrlEncoded = encodeURIComponent(bookPath);
  const resp = await fetch(
    `${urlBase}/api/admin/books/${bookPathUrlEncoded}/history`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (resp.status !== 200) {
    throw new Error(`Failed to fetch book history: ${resp.status}`);
  }
  return (await resp.json()) as BookHistory;
};

const useBookHistory = (bookPath?: string) => {
  const { urlBase } = useOutletContext() as OutletContextType;
  const { token } = useContext(SessionContext);

  return useQuery<BookHistory | null, Error>({
    queryKey: ["bookHistory", bookPath],
    queryFn: () => fetchBookHistory(urlBase, token, bookPath),
    enabled: !!bookPath,
  });
};

export default useBookHistory;
