import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { ChatMessage, ChatResponse } from "@/types/design-lab";

/**
 * Fetch chat history for an output.
 */
export function useChatHistory(outputId?: string) {
  return useQuery<ChatMessage[]>({
    queryKey: ["chat", outputId],
    queryFn: () =>
      apiRequest<ChatMessage[]>(`/api/v1/chat/outputs/${outputId}/history`),
    enabled: !!outputId,
    staleTime: 1000 * 30,
  });
}

/**
 * Send a chat message to an output.
 * Returns the assistant's response + any side effects (edited output, context/brief changes).
 */
export function useSendMessage(outputId?: string) {
  const queryClient = useQueryClient();

  return useMutation<ChatResponse, Error, string>({
    mutationFn: (message: string) =>
      apiRequest<ChatResponse>(`/api/v1/chat/outputs/${outputId}`, {
        method: "POST",
        body: { message },
      }),
    onSuccess: (data) => {
      // Refresh chat history
      queryClient.invalidateQueries({ queryKey: ["chat", outputId] });

      // If output was edited, refresh output data (including latest version)
      if (data.updated_output) {
        queryClient.invalidateQueries({ queryKey: ["output", outputId] });
        queryClient.invalidateQueries({ queryKey: ["output", outputId, "latest"] });
        queryClient.invalidateQueries({ queryKey: ["outputs"] });
      }

      // If context was updated, refresh context data
      if (data.context_changes) {
        queryClient.invalidateQueries({ queryKey: ["contexts"] });
      }

      // If brief was updated, refresh brief data
      if (data.brief_changes) {
        queryClient.invalidateQueries({ queryKey: ["briefs"] });
      }
    },
  });
}
