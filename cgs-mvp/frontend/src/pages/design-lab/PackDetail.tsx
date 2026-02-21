import { useState } from "react";
import { useLocation } from "wouter";
import { usePack } from "@/hooks/usePacks";
import { useBriefs, useDeleteBrief } from "@/hooks/useBriefs";
import { useOutputsSummary } from "@/hooks/useOutputs";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Pencil,
  Play,
  Trash2,
  Eye,
  Loader2,
  FileText,
  Cpu,
} from "lucide-react";
import type { Brief, OutputPackSummary } from "@/types/design-lab";

interface PackDetailProps {
  packId: string;
}

export default function PackDetail({ packId }: PackDetailProps) {
  const [, navigate] = useLocation();
  const contextId = useAppStore((s) => s.contextId) ?? undefined;

  // Data
  const { data: pack, isLoading: packLoading } = usePack(packId);
  const { data: briefs, isLoading: briefsLoading } = useBriefs(
    contextId,
    packId
  );
  const { data: outputsSummary } = useOutputsSummary(contextId);
  const deleteBrief = useDeleteBrief();

  // State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Helpers ──

  /** Get output count for a specific brief from the summary data */
  const getBriefOutputCount = (briefId: string): number => {
    if (!outputsSummary || !pack) return 0;
    const packSummary = outputsSummary.find(
      (s: OutputPackSummary) => s.pack_slug === pack.slug
    );
    if (!packSummary) return 0;
    const briefGroup = packSummary.briefs.find((b) => b.id === briefId);
    return briefGroup?.count ?? 0;
  };

  const handleDeleteBrief = (briefId: string) => {
    if (confirmDeleteId === briefId) {
      deleteBrief.mutate(briefId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(briefId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  // ── Loading ──
  if (packLoading || briefsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500 text-sm">Pack not found.</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/design-lab")}
          className="mt-4 text-neutral-400 hover:text-neutral-200"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Button>
      </div>
    );
  }

  const packBriefs = briefs ?? [];
  const agents = pack.agents_config ?? [];
  const totalOutputs = packBriefs.reduce(
    (sum, b) => sum + getBriefOutputCount(b.id),
    0
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ── Back button ── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/design-lab")}
          className="text-neutral-400 hover:text-neutral-200 hover:bg-surface-elevated rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Home
        </Button>
      </div>

      {/* ── Pack Header ── */}
      <Card className="bg-surface-elevated border-0 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{pack.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-neutral-100">
                  {pack.name}
                </h1>
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    pack.status === "active" || pack.user_status === "active"
                      ? "bg-accent/20 text-accent"
                      : "bg-neutral-700 text-neutral-400"
                  }`}
                >
                  {pack.status === "active" || pack.user_status === "active"
                    ? "Active"
                    : "Available"}
                </span>
              </div>

              {pack.description && (
                <p className="text-sm text-neutral-400 mb-3">
                  {pack.description}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                {pack.outcome && (
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {pack.outcome}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  {pack.default_llm_provider ?? "openai"} /{" "}
                  {pack.default_llm_model ?? "gpt-4o"}
                </span>
                {agents.length > 0 && (
                  <span>
                    {agents.length} agent{agents.length > 1 ? "s" : ""}:{" "}
                    {agents.map((a) => a.name).join(" → ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Briefs Section ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-neutral-200">
              Briefs ({packBriefs.length})
            </h2>
            {totalOutputs > 0 && (
              <span className="text-xs text-neutral-500">
                {totalOutputs} output{totalOutputs !== 1 ? "s" : ""} total
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => navigate(`/design-lab/brief/create/${packId}`)}
            className="bg-accent hover:bg-accent/90 text-black font-medium rounded-xl h-8 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Brief
          </Button>
        </div>

        {packBriefs.length === 0 ? (
          <Card className="bg-surface-elevated border-0 rounded-2xl">
            <CardContent className="py-12 text-center">
              <FileText className="w-8 h-8 mx-auto mb-3 text-neutral-600" />
              <p className="text-sm text-neutral-400 mb-1">No briefs yet</p>
              <p className="text-xs text-neutral-600 mb-4">
                Create your first brief to start generating content with this
                pack.
              </p>
              <Button
                size="sm"
                onClick={() => navigate(`/design-lab/brief/create/${packId}`)}
                className="bg-accent hover:bg-accent/90 text-black font-medium rounded-xl h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create First Brief
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {packBriefs.map((brief: Brief) => {
              const outputCount = getBriefOutputCount(brief.id);
              const statusColor =
                brief.status === "active"
                  ? "text-green-400"
                  : brief.status === "configured"
                  ? "text-blue-400"
                  : "text-yellow-400";

              return (
                <Card
                  key={brief.id}
                  className="bg-surface-elevated border-0 rounded-xl hover:bg-surface-elevated/80 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Left: name + meta */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() =>
                          navigate(`/design-lab/brief/${brief.slug}`)
                        }
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-neutral-200 truncate">
                            {brief.name}
                          </h3>
                          <span
                            className={`text-[10px] font-medium ${statusColor}`}
                          >
                            •{" "}
                            {brief.status === "active"
                              ? "Active"
                              : brief.status === "configured"
                              ? "Configured"
                              : "Draft"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {outputCount > 0 && (
                            <span className="text-xs text-neutral-500">
                              {outputCount} output
                              {outputCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          {brief.settings?.global_instructions && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent/70">
                              custom settings
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-1 ml-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            navigate(`/design-lab/brief/${brief.slug}`)
                          }
                          className="text-neutral-400 hover:text-neutral-200 h-7 w-7 p-0 rounded-lg"
                          title="View brief"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            navigate(`/design-lab/brief/${brief.slug}/edit`)
                          }
                          className="text-neutral-400 hover:text-neutral-200 h-7 w-7 p-0 rounded-lg"
                          title="Edit brief"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            navigate(`/design-lab/execute/${brief.id}`)
                          }
                          className="text-accent hover:text-accent/80 h-7 w-7 p-0 rounded-lg"
                          title="Generate content"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBrief(brief.id)}
                          className={`h-7 w-7 p-0 rounded-lg ${
                            confirmDeleteId === brief.id
                              ? "text-red-400 hover:text-red-300"
                              : "text-neutral-500 hover:text-neutral-300"
                          }`}
                          title={
                            confirmDeleteId === brief.id
                              ? "Click again to confirm"
                              : "Delete brief"
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      {totalOutputs > 0 && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/design-lab/outputs/${pack.slug}`)}
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 rounded-xl h-9 text-sm"
          >
            <FileText className="w-3.5 h-3.5 mr-2" />
            View All Content
            <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
