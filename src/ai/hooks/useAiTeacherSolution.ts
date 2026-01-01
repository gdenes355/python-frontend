import { useContext } from "react";
import SessionContext from "../../auth/contexts/SessionContext";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

const useAiTeacherSolution = (
  options: UseMutationOptions<
    string,
    Error,
    { guideMd: string; starterCode: string }
  >
) => {
  const { token, serverUrl } = useContext(SessionContext);
  return useMutation<string, Error, { guideMd: string; starterCode: string }>({
    mutationFn: async ({ guideMd, starterCode }) => {
      const res = await fetch(
        `${serverUrl}/api/admin/ai/teacher-solution-recommender`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            guide: guideMd,
            starter_code: starterCode,
          }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to generate AI solution: ${text}`);
      }
      const data = await res.json();
      return data?.data as string;
    },
    ...options,
  });
};

export default useAiTeacherSolution;
