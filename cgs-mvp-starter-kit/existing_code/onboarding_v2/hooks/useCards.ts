import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api-client';
import type { Card, CardsSnapshot, CardType } from '@shared/types/cards';
import type { SessionDetailResponse } from '@shared/types/onboarding';
import { validateCardsSnapshot } from '@/lib/cards-validator';

const MOCKS_BASE_PATH = '/mocks/cards';

export interface UseCardsOptions {
  sessionId?: string | null;
  initialCardsOutput?: CardsSnapshot | null;
}

export function useCards(options?: UseCardsOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isCustomLoaded, setIsCustomLoaded] = useState(false);

  // Query per dati mock (default fallback)
  const mockQuery = useQuery<CardsSnapshot>({
    queryKey: ['cards', 'snapshot', 'mock'],
    queryFn: async () => {
      const response = await fetch(`${MOCKS_BASE_PATH}/snapshot.json`);
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    enabled: !isCustomLoaded && !options?.sessionId && !options?.initialCardsOutput,
  });

  // Query per cards reali da session_id
  const realCardsQuery = useQuery<CardsSnapshot>({
    queryKey: ['cards', 'session', options?.sessionId],
    queryFn: async () => {
      if (!options?.sessionId) throw new Error('No session ID');
      
      try {
        // Chiamare GET /api/v1/onboarding/{session_id}
        const session = await apiRequest<SessionDetailResponse>(
          `/api/v1/onboarding/${options.sessionId}`
        );
        
        // Estrarre cards_output da session.metadata
        // metadata può essere undefined o non contenere cards_output
        if (!session.metadata) {
          throw new Error('Session metadata is empty - cards may not have been generated yet');
        }
        
        const cardsOutput = session.metadata.cards_output;
        if (!cardsOutput) {
          throw new Error('No cards_output in session metadata - cards may not have been generated yet');
        }
        
        // Convertire da dict a CardsSnapshot se necessario
        let cardsSnapshot: CardsSnapshot;
        try {
          if (typeof cardsOutput === 'string') {
            // Se è una stringa JSON, parsarla
            cardsSnapshot = JSON.parse(cardsOutput);
          } else if (typeof cardsOutput === 'object' && cardsOutput !== null) {
            // Se è già un oggetto, usarlo direttamente
            cardsSnapshot = cardsOutput as CardsSnapshot;
          } else {
            throw new Error('Invalid cards_output format: expected object or JSON string');
          }
          
          // Validare il formato (non bloccante)
          const validation = validateCardsSnapshot(cardsSnapshot);
          if (!validation.valid) {
            console.warn('Cards validation warning:', validation.error);
            // Continuare comunque, potrebbe essere un problema di validazione minore
          }
          
          return cardsSnapshot;
        } catch (parseError) {
          console.error('Failed to parse cards_output:', parseError);
          throw new Error(`Failed to parse cards_output: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Failed to fetch cards from session:', error);
        // Rilanciare l'errore per permettere il fallback
        throw error;
      }
    },
    enabled: !!options?.sessionId && !options?.initialCardsOutput && !isCustomLoaded,
    staleTime: 1000 * 60 * 5,
    retry: 1, // Retry solo una volta in caso di errore
  });

  // Query per dati custom caricati
  const customQuery = useQuery<CardsSnapshot>({
    queryKey: ['cards', 'snapshot', 'custom'],
    queryFn: async () => {
      // Questa query viene popolata manualmente tramite setQueryData
      return queryClient.getQueryData<CardsSnapshot>(['cards', 'snapshot', 'custom']) || mockQuery.data!;
    },
    staleTime: Infinity, // I dati custom non scadono
    enabled: isCustomLoaded,
  });

  // Helper per determinare il query key attivo
  const getActiveQueryKey = useCallback((): (string | number)[] => {
    if (options?.initialCardsOutput) {
      return ['cards', 'initial'];
    } else if (isCustomLoaded) {
      return ['cards', 'snapshot', 'custom'];
    } else if (options?.sessionId) {
      return ['cards', 'session', options.sessionId];
    } else {
      return ['cards', 'snapshot', 'mock'];
    }
  }, [options?.initialCardsOutput, options?.sessionId, isCustomLoaded]);

  // Query principale: priorità: initialCardsOutput > realCardsQuery > customQuery > mockQuery
  let cardsQuery: typeof mockQuery;
  
  if (options?.initialCardsOutput) {
    // Usare cards_output passato direttamente (più veloce)
    cardsQuery = {
      data: options.initialCardsOutput,
      isLoading: false,
      isError: false,
      error: null,
      refetch: async () => options.initialCardsOutput!,
    } as typeof mockQuery;
  } else if (isCustomLoaded) {
    cardsQuery = customQuery;
  } else if (options?.sessionId) {
    if (realCardsQuery.isSuccess) {
      cardsQuery = realCardsQuery;
    } else if (realCardsQuery.isLoading) {
      // Mostrare loading mentre recupera le cards reali
      cardsQuery = realCardsQuery;
    } else if (realCardsQuery.isError) {
      // Se la chiamata API fallisce, fallback a mock
      console.warn('Failed to load cards from session, falling back to mock');
      cardsQuery = mockQuery;
    } else {
      cardsQuery = mockQuery;
    }
  } else {
    cardsQuery = mockQuery;
  }

  const getCardsByType = useCallback((type: CardType): Card[] => {
    if (!cardsQuery.data?.cards) return [];
    return cardsQuery.data.cards.filter(card => card.type === type);
  }, [cardsQuery.data]);

  const getCardById = useCallback((id: string): Card | undefined => {
    if (!cardsQuery.data?.cards) return undefined;
    return cardsQuery.data.cards.find(card => card.id === id);
  }, [cardsQuery.data]);

  const selectedCard = selectedCardId ? getCardById(selectedCardId) : null;

  const updateCard = useMutation({
    mutationFn: async (updatedCard: Card) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return updatedCard;
    },
    onMutate: async (updatedCard) => {
      const queryKey = getActiveQueryKey();
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData<CardsSnapshot>(queryKey);
      
      if (previousData) {
        queryClient.setQueryData<CardsSnapshot>(queryKey, {
          ...previousData,
          cards: previousData.cards.map(card => 
            card.id === updatedCard.id 
              ? { ...updatedCard, updatedAt: new Date().toISOString() }
              : card
          ),
        });
      }
      
      return { previousData, queryKey };
    },
    onSuccess: (data) => {
      toast({
        title: 'Card aggiornata',
        description: `"${data.title}" salvata con successo`,
      });
    },
    onError: (error, _, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast({
        title: 'Errore',
        description: 'Impossibile salvare le modifiche',
        variant: 'destructive',
      });
    },
  });

  const deleteCard = useMutation({
    mutationFn: async (cardId: string) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return cardId;
    },
    onMutate: async (cardId) => {
      const queryKey = getActiveQueryKey();
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData<CardsSnapshot>(queryKey);
      
      if (previousData) {
        queryClient.setQueryData<CardsSnapshot>(queryKey, {
          ...previousData,
          cards: previousData.cards.filter(card => card.id !== cardId),
        });
      }
      
      if (selectedCardId === cardId) {
        setSelectedCardId(null);
      }
      
      return { previousData, queryKey };
    },
    onSuccess: () => {
      toast({
        title: 'Card eliminata',
        description: 'La card è stata rimossa',
      });
    },
    onError: (error, _, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare la card',
        variant: 'destructive',
      });
    },
  });

  // Mutation per caricare JSON esterno
  const loadCardsFromJson = useMutation({
    mutationFn: async (snapshot: CardsSnapshot) => {
      // Validazione
      const validation = validateCardsSnapshot(snapshot);
      if (!validation.valid) {
        throw new Error(validation.error || 'JSON non valido');
      }
      return snapshot;
    },
    onSuccess: (data) => {
      // Salva i dati custom nel cache
      queryClient.setQueryData<CardsSnapshot>(['cards', 'snapshot', 'custom'], data);
      setIsCustomLoaded(true);
      toast({
        title: 'JSON caricato',
        description: `${data.cards.length} cards caricate con successo`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Errore caricamento',
        description: error instanceof Error ? error.message : 'Impossibile caricare il file JSON',
        variant: 'destructive',
      });
    },
  });

  // Mutation per resettare ai dati mock
  const resetToMock = useMutation({
    mutationFn: async () => {
      // Rimuove i dati custom dal cache
      queryClient.removeQueries({ queryKey: ['cards', 'snapshot', 'custom'] });
      setIsCustomLoaded(false);
      // Refetch dei dati mock
      await queryClient.refetchQueries({ queryKey: ['cards', 'snapshot', 'mock'] });
    },
    onSuccess: () => {
      toast({
        title: 'Reset completato',
        description: 'Ripristinati i dati mock originali',
      });
    },
    onError: () => {
      toast({
        title: 'Errore',
        description: 'Impossibile ripristinare i dati mock',
        variant: 'destructive',
      });
    },
  });

  return {
    cards: cardsQuery.data?.cards || [],
    isLoading: cardsQuery.isLoading,
    isError: cardsQuery.isError,
    error: cardsQuery.error,
    sessionId: cardsQuery.data?.sessionId,
    generatedAt: cardsQuery.data?.generatedAt,
    
    getCardsByType,
    getCardById,
    
    selectedCardId,
    selectedCard,
    setSelectedCardId,
    
    updateCard,
    deleteCard,
    
    // Nuove funzionalità per caricamento JSON
    isCustomLoaded,
    loadCardsFromJson,
    resetToMock,
    
    refetch: cardsQuery.refetch,
  };
}

export type UseCardsReturn = ReturnType<typeof useCards>;
