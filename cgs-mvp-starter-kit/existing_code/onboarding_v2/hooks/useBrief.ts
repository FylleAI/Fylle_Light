import { useApiMutation, apiRequest } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type {
  StartBriefResponse,
  SubmitBriefAnswersResponse,
  SubmitBriefAnswersRequest,
} from '@shared/types/brief';

export function useBrief() {
  const { toast } = useToast();

  const startBrief = useApiMutation(
    async (sessionId: string) => {
      return apiRequest<StartBriefResponse>(
        `/api/v1/onboarding/${sessionId}/brief/start`,
        {
          method: 'POST',
        }
      );
    },
    {
      onSuccess: (data) => {
        toast({
          title: 'Brief generation avviato',
          description: `Rispondi a ${data.questions.length} domande per creare il brief.`,
        });
      },
      onError: (error) => {
        toast({
          title: 'Errore avvio brief',
          description: error instanceof Error ? error.message : 'Impossibile avviare la generazione del brief',
          variant: 'destructive',
        });
      },
    }
  );

  const submitBriefAnswers = useApiMutation(
    async ({ 
      sessionId, 
      answers 
    }: { 
      sessionId: string; 
      answers: Record<string, any> 
    }) => {
      return apiRequest<SubmitBriefAnswersResponse>(
        `/api/v1/onboarding/${sessionId}/brief/answers`,
        {
          method: 'POST',
          body: JSON.stringify({ answers }),
        }
      );
    },
    {
      onSuccess: (data) => {
        toast({
          title: 'Brief generato',
          description: data.message || 'Il brief è stato creato con successo!',
        });
      },
      onError: (error) => {
        toast({
          title: 'Errore generazione brief',
          description: error instanceof Error ? error.message : 'Impossibile generare il brief',
          variant: 'destructive',
        });
      },
    }
  );

  return {
    startBrief,
    submitBriefAnswers,
  };
}
