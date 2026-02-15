import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useOutput, useLatestVersion, useMarkAsSeen } from "@/hooks/useOutputs";
import { usePacks } from "@/hooks/usePacks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Info,
  Code,
  Eye,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import DOMPurify from "dompurify";
import ChatPanel from "@/components/design-lab/ChatPanel";
import ApprovalFlow from "@/components/design-lab/ApprovalFlow";
import type { ContentStatus, AgentPack, ChatResponse } from "@/types/design-lab";

interface ContentViewProps {
  packType: string;
  contentId: string;
}

const statusConfig: Record<
  ContentStatus,
  { label: string; bg: string; text: string }
> = {
  pending_review: {
    label: "To review",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
  },
  completed: {
    label: "Completed",
    bg: "bg-green-500/10",
    text: "text-green-400",
  },
  adapted: {
    label: "Adapted",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-500/10",
    text: "text-red-400",
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
  const { data: output, isLoading, refetch: refetchOutput } = useOutput(contentId);
  const { data: latestVersion } = useLatestVersion(contentId);
  const markAsSeen = useMarkAsSeen();
  const { data: packs } = usePacks();
  const [chatOpen, setChatOpen] = useState(false);
  const [viewSource, setViewSource] = useState(false);

  const pack = packs?.find((p: AgentPack) => p.slug === packType);

  // Use latest version content if available (after chat edits)
  const displayOutput = latestVersion && latestVersion.id !== contentId
    ? latestVersion
    : output;

  // Auto-mark as seen on mount
  useEffect(() => {
    if (output?.is_new && contentId) {
      markAsSeen.mutate(contentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [output?.is_new, contentId]);

  const handleOutputUpdated = (_data: ChatResponse) => {
    refetchOutput();
  };

  const handleReviewComplete = () => {
    refetchOutput();
  };

  // Derive content values (safe even when output is null)
  const currentContent = displayOutput?.text_content || output?.text_content || "";

  // Detect if content is HTML (newsletter-style) vs plain Markdown
  const isHtmlContent = useMemo(() => {
    if (!currentContent) return false;
    const trimmed = currentContent.trim();
    return (
      /^<!DOCTYPE/i.test(trimmed) ||
      /^<html/i.test(trimmed) ||
      (/<(table|div|section|header|footer|style|head|body)\b/i.test(trimmed) &&
      (trimmed.match(/<[^>]+>/g)?.length || 0) > 5)
    );
  }, [currentContent]);

  // Sanitize HTML content
  const sanitizedHtml = useMemo(() => {
    if (!currentContent || !isHtmlContent) return "";
    return DOMPurify.sanitize(currentContent, {
      ADD_TAGS: ["style", "link"],
      ADD_ATTR: ["target", "rel", "style", "class", "align", "bgcolor", "cellpadding", "cellspacing", "width", "height", "border", "valign"],
    });
  }, [currentContent, isHtmlContent]);

  // Early returns AFTER all hooks
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
        <p className="text-neutral-500">Content not found</p>
        <Button
          variant="ghost"
          onClick={() => navigate(`/design-lab/outputs/${packType}`)}
          className="mt-4 text-accent"
        >
          Back to list
        </Button>
      </div>
    );
  }

  const status = (displayOutput?.status || output.status) as ContentStatus;
  const config = statusConfig[status] || statusConfig.pending_review;
  const currentVersion = displayOutput?.version || output.version;

  return (
    <div className={`flex gap-0 ${chatOpen ? "h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)] overflow-hidden -mb-12" : ""}`}>
      {/* Main content area */}
      <div className={`space-y-6 overflow-y-auto ${chatOpen ? "w-3/5 pr-4 min-h-0" : "w-full"}`}>
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/design-lab/outputs/${packType}`)}
            className="text-neutral-400 hover:text-neutral-200 hover:bg-surface-elevated rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {pack?.name || packType}
          </Button>

          {/* Chat toggle (visible when chat is closed) */}
          {!chatOpen && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatOpen(true)}
              className="border-neutral-600 text-neutral-200 hover:text-accent hover:border-accent/40 hover:bg-accent/5 rounded-xl h-9"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Open Chat
            </Button>
          )}
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {output.number && (
              <span className="text-xs text-neutral-500 font-mono">
                #{output.number}
              </span>
            )}
            <span
              className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}
            >
              {config.label}
            </span>
            {currentVersion > 1 && (
              <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                v{currentVersion}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">
            {output.title || `Content #${output.number}`}
          </h1>
          <p className="text-sm text-neutral-400">
            {formatDate(output.created_at)} • {output.author || "AI"} •{" "}
            v{currentVersion}
          </p>
        </div>

        {/* Content preview */}
        <div className="space-y-2">
          {/* View toggle */}
          {currentContent && (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => setViewSource(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !viewSource
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
              <button
                onClick={() => setViewSource(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewSource
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Source
              </button>
              {isHtmlContent && (
                <span className="ml-2 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                  HTML
                </span>
              )}
            </div>
          )}

          <Card className="bg-surface-elevated border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              {currentContent ? (
                viewSource ? (
                  /* Source view */
                  <pre className="p-6 md:p-8 text-xs text-neutral-300 font-mono whitespace-pre-wrap break-words overflow-x-auto max-h-[70vh] overflow-y-auto bg-neutral-900/50">
                    {currentContent}
                  </pre>
                ) : isHtmlContent ? (
                  /* HTML rendered view (newsletter) - white background for email preview */
                  <div className="bg-white rounded-xl m-3 md:m-4 overflow-hidden shadow-inner">
                    <div
                      className="p-6 md:p-8 [&_*]:max-w-full [&_img]:h-auto"
                      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                    />
                  </div>
                ) : (
                  /* Markdown rendered view */
                  <div className="p-6 md:p-8">
                    <article className="prose prose-invert max-w-none prose-headings:text-white prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-neutral-100 prose-p:leading-relaxed prose-li:text-neutral-100 prose-strong:text-white prose-strong:font-semibold prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-accent/40 prose-blockquote:text-neutral-300 prose-blockquote:italic prose-code:text-accent prose-code:bg-neutral-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-neutral-900 prose-pre:rounded-xl prose-hr:border-neutral-700 prose-img:rounded-xl">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {currentContent}
                      </ReactMarkdown>
                    </article>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <Info className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-500 text-sm">
                    No text content available.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Approval Flow */}
        <ApprovalFlow
          outputId={contentId}
          currentStatus={status}
          onReviewComplete={handleReviewComplete}
        />
      </div>

      {/* Chat sidebar (right panel) */}
      {chatOpen && (
        <div className="w-2/5 h-full rounded-2xl overflow-hidden border border-neutral-800">
          <ChatPanel
            outputId={contentId}
            onClose={() => setChatOpen(false)}
            onOutputUpdated={handleOutputUpdated}
          />
        </div>
      )}
    </div>
  );
}
