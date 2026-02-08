import { useLocation } from "wouter";
import { usePacks } from "@/hooks/usePacks";
import { useBriefs } from "@/hooks/useBriefs";
import { useOutputs } from "@/hooks/useOutputs";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Sparkles,
} from "lucide-react";
import ContentRow from "@/components/design-lab/ContentRow";
import type { AgentPack, Brief, ContentItem } from "@/types/design-lab";

interface PackOutputsProps {
  packType: string; // pack slug, e.g. "newsletter", "blog"
}

export default function PackOutputs({ packType }: PackOutputsProps) {
  const [, navigate] = useLocation();
  const contextId = useAppStore((s) => s.contextId);
  const { data: packs } = usePacks();

  // Find the pack by slug
  const pack = packs?.find((p: AgentPack) => p.slug === packType);

  // Load briefs for this pack
  const { data: briefs, isLoading: briefsLoading } = useBriefs(
    contextId || undefined,
    pack?.id
  );

  // Load all outputs for the user (we'll group by brief)
  const { data: allOutputs, isLoading: outputsLoading } = useOutputs();

  const isLoading = briefsLoading || outputsLoading;

  // Group outputs by brief_id
  const outputsByBrief: Record<string, ContentItem[]> = {};
  if (allOutputs && briefs) {
    const briefIds = new Set(briefs.map((b: Brief) => b.id));
    for (const output of allOutputs) {
      if (output.brief_id && briefIds.has(output.brief_id)) {
        if (!outputsByBrief[output.brief_id]) {
          outputsByBrief[output.brief_id] = [];
        }
        outputsByBrief[output.brief_id].push(output);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/design-lab/outputs")}
          className="text-neutral-400 hover:text-neutral-200 hover:bg-surface-elevated rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Outputs Hub
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-2xl">{pack?.icon || "📦"}</span>
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">
            {pack?.name || packType}
          </h1>
          <p className="text-neutral-400 text-sm">
            {pack?.outcome || "Generated content"}
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!briefs || briefs.length === 0) && (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-neutral-300 mb-2">
              No briefs configured
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              Create a brief to start generating content.
            </p>
            {pack && (
              <Button
                onClick={() =>
                  navigate(`/design-lab/brief/create/${pack.id}`)
                }
                className="bg-accent hover:bg-accent/90 text-black font-medium rounded-xl h-11"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Brief
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Briefs with outputs */}
      {!isLoading &&
        briefs &&
        briefs.length > 0 &&
        briefs.map((brief: Brief) => {
          const outputs = outputsByBrief[brief.id] || [];

          return (
            <div key={brief.id}>
              {/* Brief section header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
                    {brief.name}
                  </h2>
                  <span className="text-xs text-neutral-500">
                    ({outputs.length} item{outputs.length === 1 ? "" : "s"})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigate(`/design-lab/execute/${brief.id}`)
                  }
                  className="text-accent hover:text-accent/80 text-xs rounded-lg"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Generate
                </Button>
              </div>

              {/* Content list */}
              {outputs.length > 0 ? (
                <div className="space-y-2">
                  {outputs.map((output: ContentItem) => (
                    <ContentRow
                      key={output.id}
                      id={output.id}
                      number={output.number}
                      title={output.title || `#${output.number}`}
                      date={output.created_at}
                      author={output.author || "AI"}
                      status={output.status}
                      isNew={output.is_new}
                      packSlug={packType}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-surface-elevated/50 border-0 rounded-xl">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-neutral-500">
                      No content yet.{" "}
                      <button
                        onClick={() =>
                          navigate(`/design-lab/execute/${brief.id}`)
                        }
                        className="text-accent hover:underline"
                      >
                        Generate the first one →
                      </button>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}

      {/* Floating CTA for new brief */}
      {!isLoading && briefs && briefs.length > 0 && pack && (
        <div className="pt-4 border-t border-neutral-800">
          <Button
            variant="outline"
            onClick={() =>
              navigate(`/design-lab/brief/create/${pack.id}`)
            }
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-xl h-10 text-sm"
          >
            + New Brief
          </Button>
        </div>
      )}
    </div>
  );
}
