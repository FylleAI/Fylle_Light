import { useLocation } from "wouter";
import { useOutput } from "@/hooks/useOutputs";
import { useArchive } from "@/hooks/useArchive";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Tag,
  MessageSquare,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArchiveDetailProps {
  outputId: string;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

const statusConfig = {
  approved: { label: "Approvato", icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  rejected: { label: "Rifiutato", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  pending: { label: "In attesa", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
};

const categoryLabels: Record<string, string> = {
  tone: "Tono",
  length: "Lunghezza",
  relevance: "Rilevanza",
  accuracy: "Accuratezza",
  structure: "Struttura",
  creativity: "Creativit\u00e0",
};

export default function ArchiveDetail({ outputId }: ArchiveDetailProps) {
  const [, navigate] = useLocation();
  const { data: output, isLoading: outputLoading } = useOutput(outputId);
  const { data: archiveItems, isLoading: archiveLoading } = useArchive();

  // Find the archive entry for this output
  const archiveItem = archiveItems?.find((a) => a.output_id === outputId);

  const isLoading = outputLoading || archiveLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!output && !archiveItem) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Elemento non trovato nell'archivio</p>
        <Button
          variant="ghost"
          onClick={() => navigate("/design-lab/archive")}
          className="mt-4 text-accent"
        >
          Torna all'archivio
        </Button>
      </div>
    );
  }

  const reviewStatus = archiveItem?.review_status || "pending";
  const cfg = statusConfig[reviewStatus] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/design-lab/archive")}
          className="text-neutral-400 hover:text-neutral-200 hover:bg-surface-elevated rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Archivio
        </Button>
      </div>

      {/* Header with status */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-xl ${cfg.bg}`}>
            <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-100">
              {archiveItem?.topic || output?.title || `Output #${outputId.slice(0, 8)}`}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-medium ${cfg.color}`}>
                {cfg.label}
              </span>
              {archiveItem?.content_type && (
                <>
                  <span className="text-xs text-neutral-600">•</span>
                  <span className="text-xs text-neutral-500">
                    {archiveItem.content_type}
                  </span>
                </>
              )}
              {archiveItem?.created_at && (
                <>
                  <span className="text-xs text-neutral-600">•</span>
                  <span className="text-xs text-neutral-500">
                    {formatDate(archiveItem.created_at)}
                  </span>
                </>
              )}
              {archiveItem?.is_reference && (
                <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3" />
                  Riferimento
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review details card */}
      {archiveItem && (archiveItem.feedback || archiveItem.feedback_categories.length > 0 || archiveItem.reference_notes) && (
        <Card className={`bg-surface-elevated border ${cfg.border} rounded-2xl`}>
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs text-neutral-500 uppercase tracking-wide flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Dettagli Valutazione
            </h3>

            {/* Feedback categories */}
            {archiveItem.feedback_categories.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500 mb-2">Categorie:</p>
                <div className="flex flex-wrap gap-2">
                  {archiveItem.feedback_categories.map((cat) => (
                    <span
                      key={cat}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300"
                    >
                      <Tag className="w-3 h-3" />
                      {categoryLabels[cat] || cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback text */}
            {archiveItem.feedback && (
              <div>
                <p className="text-xs text-neutral-500 mb-1">Feedback:</p>
                <p className="text-sm text-neutral-200 whitespace-pre-wrap">
                  {archiveItem.feedback}
                </p>
              </div>
            )}

            {/* Reference notes */}
            {archiveItem.reference_notes && (
              <div>
                <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" />
                  Note di riferimento:
                </p>
                <p className="text-sm text-neutral-200 whitespace-pre-wrap">
                  {archiveItem.reference_notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Output content */}
      {output?.text_content && (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-6 md:p-8">
            <h3 className="text-xs text-neutral-500 uppercase tracking-wide mb-4">
              Contenuto Originale
            </h3>
            <article className="prose prose-invert prose-sm max-w-none prose-headings:text-neutral-100 prose-p:text-neutral-300 prose-li:text-neutral-300 prose-strong:text-neutral-200 prose-a:text-accent prose-blockquote:border-neutral-700 prose-blockquote:text-neutral-400 prose-code:text-accent prose-code:bg-neutral-800 prose-code:px-1 prose-code:rounded prose-pre:bg-neutral-900 prose-hr:border-neutral-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {output.text_content}
              </ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      )}

      {/* Output metadata */}
      {output && (
        <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
          {output.version > 1 && (
            <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400">
              Versione {output.version}
            </span>
          )}
          {output.author && (
            <span className="px-2 py-1 rounded-lg bg-neutral-800">
              Autore: {output.author}
            </span>
          )}
          {output.output_type && (
            <span className="px-2 py-1 rounded-lg bg-neutral-800">
              Tipo: {output.output_type}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
