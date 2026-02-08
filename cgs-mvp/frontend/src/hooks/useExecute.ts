import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, fetchSSE } from "@/lib/api";

interface StartExecutionInput {
  brief_id: string;
  topic: string;
  input_data?: Record<string, unknown>;
}

interface StartExecutionResult {
  run_id: string;
}

interface RunStatus {
  id: string;
  brief_id: string;
  user_id: string;
  topic: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  current_step?: string;
  task_outputs: Record<string, string>;
  final_output?: string;
  total_tokens: number;
  total_cost_usd: number;
  duration_seconds?: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

export interface SSEEvent {
  type: "status" | "progress" | "agent_complete" | "completed" | "error";
  data: {
    status?: string;
    progress?: number;
    step?: string;
    agent?: string;
    tokens?: number;
    output_id?: string;
    total_tokens?: number;
    total_cost_usd?: number;
    duration_seconds?: number;
    error?: string;
  };
}

/**
 * Start a workflow execution.
 */
export function useStartExecution() {
  return useMutation({
    mutationFn: (data: StartExecutionInput) =>
      apiRequest<StartExecutionResult>("/api/v1/execute", {
        method: "POST",
        body: data,
      }),
  });
}

/**
 * Get run status by ID (polling).
 */
export function useRunStatus(runId?: string, enabled = true) {
  return useQuery<RunStatus>({
    queryKey: ["run", runId],
    queryFn: () => apiRequest<RunStatus>(`/api/v1/execute/${runId}`),
    enabled: !!runId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 2000; // Poll every 2s while running
    },
  });
}

/**
 * Stream execution progress via SSE.
 * Returns a function to start the stream.
 */
export function streamExecution(
  runId: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (error: Error) => void
) {
  return fetchSSE(
    `/api/v1/execute/${runId}/stream`,
    (raw) => onEvent(raw as unknown as SSEEvent),
    onError
  );
}
