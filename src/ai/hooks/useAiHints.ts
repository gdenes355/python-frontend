import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import SessionContext from "../../auth/contexts/SessionContext";
import { useContext } from "react";

const useAiHints = (
  options: UseMutationOptions<
    string,
    Error,
    {
      md: string;
      code: string;
      consoleText: string;
      bookPath: string;
      challengeId: string;
    }
  >
) => {
  const { token, serverUrl } = useContext(SessionContext);
  return useMutation<
    string,
    Error,
    {
      md: string;
      code: string;
      consoleText: string;
      bookPath: string;
      challengeId: string;
    }
  >({
    mutationFn: async ({ md, code, consoleText, bookPath, challengeId }) => {
      // only take the last 1000 characters of the console text

      const res = await fetch(`${serverUrl}/api/ai/hints`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          md,
          code: code.slice(-2000),
          consoleText: consoleText.slice(-1000),
          bookPath,
          challengeId,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to generate AI hints: ${res.statusText}`);
      }
      const data = await res.json();
      return data?.hint as string;
    },
    ...options,
  });
};

export default useAiHints;
