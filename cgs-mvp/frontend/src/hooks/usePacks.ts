import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { AgentPack } from "@/types/design-lab";

/**
 * Fetch packs, optionally filtered by context.
 * If contextId provided: returns template packs + context-specific packs
 * If no contextId: returns all templates + all user's packs
 */
export function usePacks(contextId?: string) {
  const params = new URLSearchParams();
  if (contextId) params.set("context_id", contextId);

  return useQuery<AgentPack[]>({
    queryKey: ["packs", { contextId }],
    queryFn: () =>
      apiRequest<AgentPack[]>(
        `/api/v1/packs${params.toString() ? `?${params}` : ""}`
      ),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Get a single pack by ID.
 */
export function usePack(packId?: string) {
  return useQuery<AgentPack>({
    queryKey: ["pack", packId],
    queryFn: () => apiRequest<AgentPack>(`/api/v1/packs/${packId}`),
    enabled: !!packId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Clone a pack to a specific context.
 */
export function useClonePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      packId,
      contextId,
      name,
    }: {
      packId: string;
      contextId: string;
      name?: string;
    }) =>
      apiRequest<AgentPack>(`/api/v1/packs/${packId}/clone`, {
        method: "POST",
        body: JSON.stringify({ context_id: contextId, name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
    },
  });
}

/**
 * Create a new pack for a context.
 */
export function useCreatePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      context_id: string;
      slug: string;
      name: string;
      description: string;
      icon: string;
      outcome: string;
      status?: string;
      content_type_id?: string;
      sort_order?: number;
    }) =>
      apiRequest<AgentPack>("/api/v1/packs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
    },
  });
}

/**
 * Update an existing pack (user must own it).
 */
export function useUpdatePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      packId,
      updates,
    }: {
      packId: string;
      updates: Partial<AgentPack>;
    }) =>
      apiRequest<AgentPack>(`/api/v1/packs/${packId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
    },
  });
}

/**
 * Delete a pack (user must own it, no briefs using it).
 */
export function useDeletePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (packId: string) =>
      apiRequest<{ deleted: boolean }>(`/api/v1/packs/${packId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
    },
  });
}
