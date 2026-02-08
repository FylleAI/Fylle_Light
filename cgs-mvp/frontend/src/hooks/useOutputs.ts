import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { ContentItem, OutputPackSummary } from "@/types/design-lab";

/**
 * Fetch outputs list, optionally filtered by brief_id.
 * Only returns root outputs (no intermediate versions).
 */
export function useOutputs(briefId?: string) {
  const qs = briefId ? `?brief_id=${briefId}` : "";
  return useQuery<ContentItem[]>({
    queryKey: ["outputs", { briefId }],
    queryFn: () => apiRequest<ContentItem[]>(`/api/v1/outputs${qs}`),
    staleTime: 1000 * 60,
  });
}

/**
 * Fetch aggregated outputs summary: packs with brief counters and new flags.
 */
export function useOutputsSummary() {
  return useQuery<OutputPackSummary[]>({
    queryKey: ["outputs", "summary"],
    queryFn: () => apiRequest<OutputPackSummary[]>("/api/v1/outputs/summary"),
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
