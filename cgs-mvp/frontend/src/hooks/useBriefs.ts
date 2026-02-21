import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { Brief, BriefSettings } from "@/types/design-lab";

interface CreateBriefInput {
  context_id: string;
  pack_id: string;
  name: string;
  answers: Record<string, unknown>;
  settings?: BriefSettings;
}

interface UpdateBriefInput {
  name?: string;
  description?: string;
  answers?: Record<string, unknown>;
  compiled_brief?: string;
  settings?: BriefSettings;
  status?: string;
}

/**
 * Fetch list of briefs, optionally filtered by context_id and/or pack_id.
 */
export function useBriefs(contextId?: string, packId?: string) {
  const params = new URLSearchParams();
  if (contextId) params.set("context_id", contextId);
  if (packId) params.set("pack_id", packId);
  const qs = params.toString();

  return useQuery<Brief[]>({
    queryKey: ["briefs", { contextId, packId }],
    queryFn: () => apiRequest<Brief[]>(`/api/v1/briefs${qs ? `?${qs}` : ""}`),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch a single brief by UUID.
 */
export function useBrief(id?: string) {
  return useQuery<Brief>({
    queryKey: ["brief", id],
    queryFn: () => apiRequest<Brief>(`/api/v1/briefs/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch a single brief by slug (for frontend routing).
 */
export function useBriefBySlug(slug?: string) {
  return useQuery<Brief>({
    queryKey: ["brief", "slug", slug],
    queryFn: () => apiRequest<Brief>(`/api/v1/briefs/by-slug/${slug}`),
    enabled: !!slug,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Create a new brief.
 */
export function useCreateBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBriefInput) =>
      apiRequest<Brief>("/api/v1/briefs", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefs"] });
      queryClient.invalidateQueries({ queryKey: ["packs"] });
    },
  });
}

/**
 * Update an existing brief.
 */
export function useUpdateBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBriefInput }) =>
      apiRequest<Brief>(`/api/v1/briefs/${id}`, {
        method: "PATCH",
        body: data,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["brief", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["briefs"] });
    },
  });
}

/**
 * Duplicate a brief.
 */
export function useDuplicateBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<Brief>(`/api/v1/briefs/${id}/duplicate`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefs"] });
    },
  });
}

/**
 * Delete a brief.
 */
export function useDeleteBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/v1/briefs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefs"] });
      queryClient.invalidateQueries({ queryKey: ["context-summary"] });
    },
  });
}
