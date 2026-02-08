import { useEffect } from "react";
import { useLocation } from "wouter";
import { useOutput, useMarkAsSeen } from "@/hooks/useOutputs";
import { usePacks } from "@/hooks/usePacks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  CheckCircle,
  Info,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentStatus, AgentPack } from "@/types/design-lab";

interface ContentViewProps {
  packType: string;
  contentId: string;
}

const statusConfig: Record<
  ContentStatus,
  { label: string; bg: string; text: string }
> = {
  da_approvare: {
    label: "Da approvare",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
  },
  completato: {
    label: "Completato",
    bg: "bg-green-500/10",
    text: "text-green-400",
  },
  adattato: {
    label: "Adattato",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
  },
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function ContentView({ packType, contentId }: ContentViewProps) {
  const [, navigate] = useLocation();
  const { data: output, isLoading } = useOutput(contentId);
  const markAsSeen = useMarkAsSeen();
  const { data: packs } = usePacks();

  const pack = packs?.find((p: AgentPack) => p.slug === packType);

  // Auto-mark as seen on mount
  useEffect(() => {
    if (output?.is_new && contentId) {
      markAsSeen.mutate(contentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [output?.is_new, contentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!output) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Contenuto non trovato</p>
        <Button
          variant="ghost"
          onClick={() => navigate(`/design-lab/outputs/${packType}`)}
          className="mt-4 text-accent"
        >
          Torna alla lista
        </Button>
      </div>
    );
  }

  const status = output.status as ContentStatus;
  const config = statusConfig[status] || statusConfig.da_approvare;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/design-lab/outputs/${packType}`)}
          className="text-neutral-400 hover:text-neutral-200 hover:bg-surface-elevated rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {pack?.name || packType}
        </Button>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {output.number && (
            <span className="text-xs text-neutral-500 font-mono">
              #{output.number}
            </span>
          )}
          <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-100">
          {output.title || `Contenuto #${output.number}`}
        </h1>
        <p className="text-sm text-neutral-500">
          {formatDate(output.created_at)} • {output.author || "AI"} •{" "}
          v{output.version}
        </p>
      </div>

      {/* Content preview (Markdown) */}
      <Card className="bg-surface-elevated border-0 rounded-2xl">
        <CardContent className="p-6 md:p-8">
          {output.text_content ? (
            <article className="prose prose-invert prose-sm max-w-none prose-headings:text-neutral-100 prose-p:text-neutral-300 prose-li:text-neutral-300 prose-strong:text-neutral-200 prose-a:text-accent prose-blockquote:border-neutral-700 prose-blockquote:text-neutral-400 prose-code:text-accent prose-code:bg-neutral-800 prose-code:px-1 prose-code:rounded prose-pre:bg-neutral-900 prose-hr:border-neutral-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {output.text_content}
              </ReactMarkdown>
            </article>
          ) : (
            <div className="text-center py-12">
              <Info className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-neutral-500 text-sm">
                Nessun contenuto testuale disponibile.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons (Chat and Approve are placeholder for FASE 4) */}
      <div className="flex flex-wrap gap-3">
        <Button
          disabled
          className="border-neutral-700 text-neutral-500 rounded-xl h-11 cursor-not-allowed opacity-50"
          variant="outline"
          title="Coming in FASE 4"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Apri Chat
          <span className="ml-2 text-[10px] text-neutral-600">(FASE 4)</span>
        </Button>

        <Button
          disabled
          className="border-neutral-700 text-neutral-500 rounded-xl h-11 cursor-not-allowed opacity-50"
          variant="outline"
          title="Coming in FASE 4"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Approva
          <span className="ml-2 text-[10px] text-neutral-600">(FASE 4)</span>
        </Button>
      </div>
    </div>
  );
}
