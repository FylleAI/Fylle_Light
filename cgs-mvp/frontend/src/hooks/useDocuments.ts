import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { Document } from "@/types/design-lab";
import { supabase } from "@/lib/supabase";

/**
 * Fetch all documents for a specific context.
 */
export function useContextDocuments(contextId?: string) {
  return useQuery<Document[]>({
    queryKey: ["context-documents", contextId],
    queryFn: () =>
      apiRequest<Document[]>(`/api/v1/documents/contexts/${contextId}`),
    enabled: !!contextId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Fetch all documents for a specific brief.
 */
export function useBriefDocuments(briefId?: string) {
  return useQuery<Document[]>({
    queryKey: ["brief-documents", briefId],
    queryFn: () =>
      apiRequest<Document[]>(`/api/v1/documents/briefs/${briefId}`),
    enabled: !!briefId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Upload a document to a context.
 */
export function useUploadContextDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contextId,
      file,
      description,
    }: {
      contextId: string;
      file: File;
      description?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (description) formData.append("description", description);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch(
        `/api/v1/documents/contexts/${contextId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["context-documents", variables.contextId],
      });
    },
  });
}

/**
 * Upload a document to a brief.
 */
export function useUploadBriefDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      briefId,
      file,
      description,
    }: {
      briefId: string;
      file: File;
      description?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (description) formData.append("description", description);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch(`/api/v1/documents/briefs/${briefId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["brief-documents", variables.briefId],
      });
    },
  });
}

/**
 * Delete a document (context or brief).
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: "context" | "brief" }) =>
      apiRequest(`/api/v1/documents/${type}s/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      // Invalidate both types of documents to be safe
      queryClient.invalidateQueries({ queryKey: ["context-documents"] });
      queryClient.invalidateQueries({ queryKey: ["brief-documents"] });
    },
  });
}

/**
 * Get download URL for a document.
 */
export async function getDocumentDownloadUrl(
  id: string,
  type: "context" | "brief"
): Promise<string> {
  const result = await apiRequest<{ download_url: string }>(
    `/api/v1/documents/${type}s/${id}/download`
  );
  return result.download_url;
}
