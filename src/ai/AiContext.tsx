import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import useAiHints from "./hooks/useAiHints";

const COOLDOWN_MS = 15_000;

export type UseAiOptions = {
  /** Reserved for future use (e.g. reason, feature flag). */
  _args?: Record<string, unknown>;
};

export type AiContextType = {
  isThinking: boolean;
  isOnCooldown: boolean;
  error: Error | null;
  response: string | null;
  askAi: (
    md: string,
    code: string,
    consoleText: string,
    bookPath: string,
    challengeId: string
  ) => void;
};

const defaultAiContext: AiContextType = {
  isThinking: false,
  isOnCooldown: false,
  error: null,
  response: null,
  askAi: (
    _md: string,
    _code: string,
    _consoleText: string,
    _bookPath: string,
    _challengeId: string
  ) => {},
};

const AiContext = createContext<AiContextType>(defaultAiContext);

export function AiProvider({ children }: { children: ReactNode }) {
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isOnCooldown, setIsOnCooldown] = useState(true);

  const lastCode = useRef<string | null>(null);

  const removeCooldown = useCallback(() => {
    const timeout = setTimeout(() => {
      setIsOnCooldown(false);
    }, COOLDOWN_MS);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    removeCooldown();
  }, [removeCooldown]);

  const { mutate: generateHints, isPending: isGeneratingHints } = useAiHints({
    onSuccess: (data) => {
      setResponse(data);
      removeCooldown();
    },
    onError: (error) => {
      setError(error);
      removeCooldown();
    },
  });

  const askAiInternal = useCallback(
    async (
      md: string,
      code: string,
      consoleText: string,
      bookPath: string,
      challengeId: string
    ) => {
      if (isGeneratingHints) return;
      if (isOnCooldown) return;

      setIsOnCooldown(true);
      setResponse(null);
      setError(null);

      code = code.trim();
      consoleText = consoleText.trim();

      if (lastCode.current === code) {
        // await 1s
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setResponse(
          "You seem to be resubmitting the same code. Please attempt the task yourself, then ask me for help if you get stuck again."
        );
        removeCooldown();
        return;
      }

      if (code.length < 1) {
        setResponse("I can't help you with an empty code.");
        removeCooldown();
        return;
      }

      lastCode.current = code;

      generateHints({ md, code, consoleText, bookPath, challengeId });
    },
    [generateHints, isOnCooldown, isGeneratingHints, removeCooldown]
  );

  const askAiInternalRef = useRef(askAiInternal);
  useEffect(() => {
    askAiInternalRef.current = askAiInternal;
  }, [askAiInternal]);

  const askAi = useCallback(
    (
      md: string,
      code: string,
      consoleText: string,
      bookPath: string,
      challengeId: string
    ) => {
      askAiInternalRef.current(md, code, consoleText, bookPath, challengeId);
    },
    []
  );

  return (
    <AiContext.Provider
      value={{
        isThinking: isGeneratingHints,
        isOnCooldown,
        response,
        askAi,
        error,
      }}
    >
      {children}
    </AiContext.Provider>
  );
}

export default AiContext;
