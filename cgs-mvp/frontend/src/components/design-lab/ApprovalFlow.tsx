import { useState } from "react";
import { useReviewOutput } from "@/hooks/useOutputReview";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Rocket,
  XCircle,
  Loader2,
  Star,
  Send,
} from "lucide-react";
import type { ApprovalPhase, ReviewRequest } from "@/types/design-lab";

interface ApprovalFlowProps {
  outputId: string;
  currentStatus: string;
  onReviewComplete?: () => void;
}

const FEEDBACK_CATEGORIES = [
  { id: "tone", label: "Tone" },
  { id: "length", label: "Length" },
  { id: "relevance", label: "Relevance" },
  { id: "accuracy", label: "Accuracy" },
  { id: "structure", label: "Structure" },
  { id: "creativity", label: "Creativity" },
];

export default function ApprovalFlow({
  outputId,
  currentStatus,
  onReviewComplete,
}: ApprovalFlowProps) {
  const review = useReviewOutput(outputId);
  const [phase, setPhase] = useState<ApprovalPhase>("idle");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isReference, setIsReference] = useState(false);

  // Already reviewed
  if (currentStatus === "completato") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-green-500/5 border border-green-500/10 rounded-xl">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <span className="text-sm text-green-400 font-medium">
          Content approved
        </span>
      </div>
    );
  }

  const handleApprove = () => {
    setPhase("sending");

    const req: ReviewRequest = {
      status: "approved",
      is_reference: isReference,
    };

    review.mutate(req, {
      onSuccess: () => {
        setPhase("sent");
        setTimeout(() => {
          onReviewComplete?.();
        }, 2000);
      },
      onError: () => {
        setPhase("idle");
      },
    });
  };

  const handleReject = () => {
    if (!feedback.trim()) return;

    const req: ReviewRequest = {
      status: "rejected",
      feedback: feedback.trim(),
      feedback_categories: selectedCategories,
    };

    review.mutate(req, {
      onSuccess: () => {
        setShowRejectForm(false);
        setFeedback("");
        setSelectedCategories([]);
        onReviewComplete?.();
      },
    });
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // Sending animation
  if (phase === "sending") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 animate-in fade-in">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
            <Rocket className="w-6 h-6 text-accent animate-bounce" />
          </div>
        </div>
        <p className="text-sm text-neutral-400">Sending...</p>
        <div className="w-48 h-1 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full animate-[progress_1.8s_ease-in-out_forwards]" />
        </div>
      </div>
    );
  }

  // Sent confirmation
  if (phase === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 animate-in fade-in zoom-in-95">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-400" />
        </div>
        <p className="text-sm font-medium text-green-400">
          Content approved!
        </p>
        <p className="text-xs text-neutral-500">
          {isReference
            ? "Saved as reference for future generations"
            : "Archived as completed"}
        </p>
      </div>
    );
  }

  // Reject form
  if (showRejectForm) {
    return (
      <div className="space-y-4 p-4 bg-surface-elevated rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-neutral-200">
            Rejection feedback
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRejectForm(false)}
            className="h-7 text-xs text-neutral-500"
          >
            Cancel
          </Button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedCategories.includes(cat.id)
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-surface border-neutral-700 text-neutral-400 hover:border-neutral-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Feedback text */}
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Explain what's wrong and what you'd like differently..."
          rows={3}
          className="w-full bg-surface text-neutral-200 text-sm rounded-xl px-4 py-3 resize-none border border-neutral-700 focus:border-red-500/50 focus:outline-none placeholder:text-neutral-600"
        />

        <Button
          onClick={handleReject}
          disabled={!feedback.trim() || review.isPending}
          className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl h-10"
        >
          {review.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Submit feedback
        </Button>
      </div>
    );
  }

  // Default: action buttons
  return (
    <div className="space-y-3">
      {/* Reference toggle */}
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={isReference}
          onChange={(e) => setIsReference(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-4 h-4 rounded border border-neutral-600 peer-checked:bg-accent peer-checked:border-accent flex items-center justify-center transition-colors">
          {isReference && <Star className="w-2.5 h-2.5 text-white" />}
        </div>
        <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">
          Save as reference (improves future generations)
        </span>
      </label>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleApprove}
          disabled={review.isPending}
          className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl h-11"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve
        </Button>

        <Button
          onClick={() => setShowRejectForm(true)}
          disabled={review.isPending}
          variant="outline"
          className="flex-1 border-neutral-700 text-neutral-400 hover:text-red-400 hover:border-red-500/30 rounded-xl h-11"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>

      {review.isError && (
        <p className="text-xs text-red-400">
          Error: {review.error.message}
        </p>
      )}
    </div>
  );
}
