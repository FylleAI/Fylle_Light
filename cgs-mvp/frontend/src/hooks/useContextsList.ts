import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface Context {
  id: string;
  user_id: string;
  brand_name: string;
  created_at: string;
}

/**
 * Hook to get all contexts for the current user
 */
export function useContextsList() {
  return useQuery<Context[]>({
    queryKey: ["contexts-list"],
    queryFn: () => apiRequest<Context[]>("/api/v1/contexts"),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new context
 */
export function useCreateContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandName: string) =>
      apiRequest<Context>("/api/v1/contexts", {
        method: "POST",
        body: {
          name: brandName,
          brand_name: brandName
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contexts-list"] });
    },
  });
}

/**
 * Hook to import a context from template file
 */
export function useImportContext() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // Get token from Supabase session (not localStorage!)
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No authentication session found. Please log in.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/contexts/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Import failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contexts-list'] });
    }
  });
}

/**
 * Hook to export a context as template
 */
interface ExportData {
  context: Context;
  [key: string]: unknown;
}

export function useExportContext() {
  return useMutation({
    mutationFn: async (contextId: string) => {
      const data = await apiRequest<ExportData>(`/api/v1/contexts/${contextId}/export`);

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.context.brand_name.replace(/\s+/g, '_')}_template.json`;
      a.click();
      URL.revokeObjectURL(url);

      return data;
    }
  });
}
