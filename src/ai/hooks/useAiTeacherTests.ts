import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useContext } from "react";
import SessionContext from "../../auth/contexts/SessionContext";
import { TestCase } from "../../models/Tests";

const useAiTeacherTests = (
  options: UseMutationOptions<
    TestCase[],
    Error,
    { guideMd: string; starterCode: string }
  >
) => {
  const { token, serverUrl } = useContext(SessionContext);
  return useMutation<
    TestCase[],
    Error,
    { guideMd: string; starterCode: string }
  >({
    mutationFn: async ({
      guideMd,
      starterCode,
    }: {
      guideMd: string;
      starterCode: string;
    }) => {
      const res = await fetch(
        `${serverUrl}/api/admin/ai/teacher-test-recommender`,
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
        throw new Error(`Failed to generate AI tests: ${res.statusText}`);
      }
      const data = await res.json();
      const text = data?.text as string;
      const tests = data?.tests;
      console.log(text);

      // remap inputs to "in"
      tests.forEach((test: any) => {
        test.in = test.inputs;
        delete test.inputs;
      });
      return tests as TestCase[];
    },
    ...options,
  });
};

export default useAiTeacherTests;
