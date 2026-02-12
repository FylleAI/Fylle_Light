import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { ContentItem, OutputPackSummary } from "@/types/design-lab";

/**
 * Fetch outputs list, optionally filtered by brief_id and context_id.
 * Only returns root outputs (no intermediate versions).
 */
export function useOutputs(briefId?: string, contextId?: string) {
  const params = new URLSearchParams();
  if (briefId) params.set("brief_id", briefId);
  if (contextId) params.set("context_id", contextId);
  const qs = params.toString() ? `?${params}` : "";
  return useQuery<ContentItem[]>({
    queryKey: ["outputs", { briefId, contextId }],
    queryFn: () => apiRequest<ContentItem[]>(`/api/v1/outputs${qs}`),
    staleTime: 1000 * 60,
  });
}

/**
 * Fetch aggregated outputs summary: packs with brief counters and new flags.
 * Optionally filtered by context_id.
 */
export function useOutputsSummary(contextId?: string) {
  const qs = contextId ? `?context_id=${contextId}` : "";
  return useQuery<OutputPackSummary[]>({
    queryKey: ["outputs", "summary", { contextId }],
    queryFn: () => apiRequest<OutputPackSummary[]>(`/api/v1/outputs/summary${qs}`),
    staleTime: 1000 * 60,
  });
}

/**
 * Fetch a single output by ID.
 */
export function useOutput(id?: string) {
  return useQuery<ContentItem>({
    queryKey: ["output", id],
    queryFn: () => apiRequest<ContentItem>(`/api/v1/outputs/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

/**
 * Fetch the latest version of an output in the edit chain.
 */
export function useLatestVersion(id?: string) {
  return useQuery<ContentItem>({
    queryKey: ["output", id, "latest"],
    queryFn: () => apiRequest<ContentItem>(`/api/v1/outputs/${id}/latest`),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
}

/**
 * Mark an output as seen (is_new: false).
 */
export function useMarkAsSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/v1/outputs/${id}`, {
        method: "PATCH",
        body: { is_new: false },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outputs"] });
    },
  });
}

/**
 * Delete an output.
 */
export function useDeleteOutput() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/v1/outputs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outputs"] });
    },
  });
}
