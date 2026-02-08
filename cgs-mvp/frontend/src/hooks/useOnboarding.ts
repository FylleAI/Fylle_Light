import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type {
  StartOnboardingRequest,
  StartOnboardingResponse,
  SubmitAnswersResponse,
  SessionStatusResponse,
} from "@/types/onboarding";

const SESSION_KEY = "fylle_onboarding_session";

export function useOnboarding() {
  const [sessionId, setSessionIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });

  const setSessionId = useCallback((id: string | null) => {
    setSessionIdState(id);
    try {
      if (id) {
        localStorage.setItem(SESSION_KEY, id);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const clearSession = useCallback(() => {
    setSessionId(null);
  }, [setSessionId]);

  const startOnboarding = useMutation({
    mutationFn: async (data: StartOnboardingRequest) => {
      const result = await apiRequest<StartOnboardingResponse>(
        "/api/v1/onboarding/start",
        { method: "POST", body: data }
      );
      return result;
    },
    onSuccess: (data) => {
      setSessionId(data.session_id);
    },
  });

  const submitAnswers = useMutation({
    mutationFn: async ({
      sessionId: sid,
      answers,
    }: {
      sessionId: string;
      answers: Record<string, unknown>;
    }) => {
      const result = await apiRequest<SubmitAnswersResponse>(
        `/api/v1/onboarding/${sid}/answers`,
        { method: "POST", body: { answers } }
      );
      return result;
    },
  });

  const pollStatus = useCallback(
    async (sid: string): Promise<SessionStatusResponse> => {
      return apiRequest<SessionStatusResponse>(
        `/api/v1/onboarding/${sid}/status`
      );
    },
    []
  );

  return {
    sessionId,
    setSessionId,
    clearSession,
    startOnboarding,
    submitAnswers,
    pollStatus,
  };
}
