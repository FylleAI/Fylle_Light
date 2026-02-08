import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { ReviewRequest } from "@/types/design-lab";

/**
 * Submit a review (approve/reject) for an output.
 * Updates both archive.review_status and outputs.status.
 */
export function useReviewOutput(outputId?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ reviewed: boolean }, Error, ReviewRequest>({
    mutationFn: (review: ReviewRequest) =>
      apiRequest<{ reviewed: boolean }>(
        `/api/v1/outputs/${outputId}/review`,
        {
          method: "POST",
          body: review,
        }
      ),
    onSuccess: () => {
      // Refresh output data to reflect new status
      queryClient.invalidateQueries({ queryKey: ["output", outputId] });
      queryClient.invalidateQueries({ queryKey: ["outputs"] });
    },
  });
}
