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
        body: { context_id: contextId, name },
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
        body: data,
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
        body: updates,
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

/**
 * Import pack from JSON/YAML template file.
 */
export function useImportPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      contextId,
    }: {
      file: File;
      contextId?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (contextId) {
        formData.append("context_id", contextId);
      }

      // Get auth token from Supabase session
      const { supabase } = await import("@/lib/supabase");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/packs/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Import failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packs"] });
    },
  });
}

/**
 * Export pack as JSON template.
 */
export function useExportPack() {
  return useMutation({
    mutationFn: async (packId: string) => {
      const data = await apiRequest<any>(`/api/v1/packs/${packId}/export`);

      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.name || "pack"}-template.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return data;
    },
  });
}
