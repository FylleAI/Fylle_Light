/**
 * Hooks per gestire i context items gerarchici (dati da CSV).
 * - useContextItems: fetch dell'albero
 * - useUpdateContextItem: aggiorna un singolo nodo
 * - useImportContextCSV: upload CSV per popolare il contesto
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { ContextItem } from "@/types/design-lab";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/** Fetch l'albero completo dei context items */
export function useContextItems(contextId?: string) {
  const storeContextId = useAppStore((s) => s.contextId);
  const ctxId = contextId || storeContextId;

  return useQuery<ContextItem[]>({
    queryKey: ["context-items-tree", ctxId],
    queryFn: () =>
      apiRequest<ContextItem[]>(`/api/v1/contexts/${ctxId}/items/tree`),
    enabled: !!ctxId,
    staleTime: 1000 * 60 * 5, // 5 minuti di cache
  });
}

/** Aggiorna un singolo context item (nome o contenuto) */
export function useUpdateContextItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const ctxId = useAppStore((s) => s.contextId);

  return useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      data: { name?: string; content?: string };
    }) =>
      apiRequest(`/api/v1/contexts/${ctxId}/items/${itemId}`, {
        method: "PATCH",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["context-items-tree", ctxId],
      });
      toast({ title: "Item updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Unable to save changes",
        variant: "destructive",
      });
    },
  });
}

/** Importa un file CSV con dati gerarchici del contesto */
export function useImportContextCSV() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const ctxId = useAppStore((s) => s.contextId);

  return useMutation({
    mutationFn: async (file: File) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No active session. Please log in again.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE}/api/v1/contexts/${ctxId}/items/import-csv`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ detail: "CSV import failed" }));
        throw new Error(error.detail || "CSV import failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["context-items-tree", ctxId],
      });
      queryClient.invalidateQueries({
        queryKey: ["context-summary", ctxId],
      });
      toast({
        title: "CSV imported!",
        description: `${data.items_count} items loaded successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
