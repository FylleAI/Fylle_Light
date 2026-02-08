import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

interface BackendCard {
  id: string;
  context_id: string;
  card_type: string;
  title: string;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useCards(contextId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const storeContextId = useAppStore((s) => s.contextId);
  const ctxId = contextId || storeContextId;

  const cardsQuery = useQuery<BackendCard[]>({
    queryKey: ["cards", ctxId],
    queryFn: () => apiRequest<BackendCard[]>(`/api/v1/contexts/${ctxId}/cards`),
    enabled: !!ctxId,
    staleTime: 1000 * 60 * 5,
  });

  const updateCard = useMutation({
    mutationFn: async ({
      cardType,
      content,
    }: {
      cardType: string;
      content: Record<string, unknown>;
    }) => {
      return apiRequest(`/api/v1/contexts/${ctxId}/cards/${cardType}`, {
        method: "PATCH",
        body: { content },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", ctxId] });
      toast({ title: "Card aggiornata", description: "Salvata con successo" });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche",
        variant: "destructive",
      });
    },
  });

  const getCardsByType = (type: string): BackendCard[] => {
    return (cardsQuery.data || []).filter((c) => c.card_type === type);
  };

  return {
    cards: cardsQuery.data || [],
    isLoading: cardsQuery.isLoading,
    isError: cardsQuery.isError,
    getCardsByType,
    updateCard,
    refetch: cardsQuery.refetch,
  };
}
