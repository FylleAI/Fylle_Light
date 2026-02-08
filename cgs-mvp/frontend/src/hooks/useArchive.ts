import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export interface ArchiveItem {
  id: string;
  output_id: string;
  run_id: string;
  context_id: string;
  brief_id: string;
  user_id: string;
  topic: string;
  content_type: string;
  review_status: "approved" | "rejected" | "pending";
  feedback?: string | null;
  feedback_categories: string[];
  is_reference: boolean;
  reference_notes?: string | null;
  created_at: string;
}

export interface ArchiveStats {
  total: number;
  approved: number;
  rejected: number;
  pending_count: number;
  references_count: number;
}

/**
 * Fetch all archive items for the current user.
 */
export function useArchive() {
  return useQuery<ArchiveItem[]>({
    queryKey: ["archive"],
    queryFn: () => apiRequest<ArchiveItem[]>("/api/v1/archive"),
    staleTime: 1000 * 60,
  });
}

/**
 * Fetch archive statistics (approved, rejected, pending counts).
 */
export function useArchiveStats() {
  return useQuery<ArchiveStats>({
    queryKey: ["archive", "stats"],
    queryFn: () => apiRequest<ArchiveStats>("/api/v1/archive/stats"),
    staleTime: 1000 * 60,
  });
}

/**
 * Semantic search in archive using embeddings.
 */
export function useArchiveSearch() {
  return useMutation<ArchiveItem[], Error, { query: string; context_id: string }>({
    mutationFn: (data) =>
      apiRequest<ArchiveItem[]>("/api/v1/archive/search", {
        method: "POST",
        body: data,
      }),
  });
}
