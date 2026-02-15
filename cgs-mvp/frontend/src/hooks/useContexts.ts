import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAppStore } from "@/lib/store";

interface Context {
  id: string;
  user_id: string;
  brand_name: string;
  company_info: Record<string, unknown>;
  research_data: Record<string, unknown>;
  voice_info: Record<string, unknown>;
  settings: Record<string, unknown>;
  created_at: string;
}

interface ContextSummary {
  fonti_informative: {
    label: string;
    data: Record<string, unknown>;
    count: number;
  };
  fonti_mercato: {
    label: string;
    data: Record<string, unknown>;
    has_data: boolean;
  };
  brand: {
    label: string;
    data: Record<string, unknown>;
    cards: { card_type: string; title: string }[];
  };
  operativo: {
    label: string;
    cards: { card_type: string; title: string }[];
  };
  agent_pack: {
    label: string;
    briefs: { id: string; name: string; pack_id: string }[];
    count: number;
  };
  context_items: {
    label: string;
    count: number;
    has_data: boolean;
  };
}

export function useContext(contextId?: string) {
  const storeContextId = useAppStore((s) => s.contextId);
  const id = contextId || storeContextId;

  return useQuery<Context>({
    queryKey: ["context", id],
    queryFn: () => apiRequest<Context>(`/api/v1/contexts/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Update context metadata (company_info, voice_info, audience_info, goals_info, name).
 */
export function useUpdateContext() {
  const queryClient = useQueryClient();
  const storeContextId = useAppStore((s) => s.contextId);

  return useMutation({
    mutationFn: ({
      contextId,
      updates,
    }: {
      contextId?: string;
      updates: Partial<Context>;
    }) => {
      const id = contextId || storeContextId;
      if (!id) throw new Error("No context ID");
      return apiRequest<Context>(`/api/v1/contexts/${id}`, {
        method: "PATCH",
        body: updates,
      });
    },
    onSuccess: (_, { contextId }) => {
      const id = contextId || storeContextId;
      queryClient.invalidateQueries({ queryKey: ["context", id] });
      queryClient.invalidateQueries({ queryKey: ["context-summary", id] });
    },
  });
}

export function useContextSummary(contextId?: string) {
  const storeContextId = useAppStore((s) => s.contextId);
  const id = contextId || storeContextId;

  return useQuery<ContextSummary>({
    queryKey: ["context-summary", id],
    queryFn: () =>
      apiRequest<ContextSummary>(`/api/v1/contexts/${id}/summary`),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}
