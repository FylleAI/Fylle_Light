import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { AgentPack } from "@/types/design-lab";

export function usePacks() {
  return useQuery<AgentPack[]>({
    queryKey: ["packs"],
    queryFn: () => apiRequest<AgentPack[]>("/api/v1/packs"),
    staleTime: 1000 * 60 * 5,
  });
}
