import { useLocation } from "wouter";
import { usePacks, useClonePack } from "@/hooks/usePacks";
import { useContextSummary } from "@/hooks/useContexts";
import { useDeleteBrief } from "@/hooks/useBriefs";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AgentPackList() {
  const [, navigate] = useLocation();
  const contextId = useAppStore((s) => s.contextId);
  const { data: packs, isLoading: packsLoading } = usePacks(contextId);
  const { data: summary } = useContextSummary(contextId);
  const deleteBrief = useDeleteBrief();
  const clonePack = useClonePack();
  const { toast } = useToast();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [cloningPackId, setCloningPackId] = useState<string | null>(null);

  if (packsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!packs || packs.length === 0) {
    return (
      <p className="text-neutral-500 text-sm italic py-4">
        No Agent Packs configured.
      </p>
    );
  }

  const handleDelete = (briefId: string) => {
    if (confirmDeleteId === briefId) {
      deleteBrief.mutate(briefId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(briefId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleClonePack = async (packId: string, packName: string) => {
    if (!contextId) {
      toast({
        title: "No context selected",
        description: "Please select a context first",
        variant: "destructive",
      });
      return;
    }

    setCloningPackId(packId);
    try {
      await clonePack.mutateAsync({
        packId,
        contextId,
        name: `${packName} (Copy)`,
      });
      toast({
        title: "Pack cloned successfully",
        description: `${packName} has been added to this context`,
      });
    } catch (error) {
      toast({
        title: "Clone failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCloningPackId(null);
    }
  };

  // Separate template packs from context-specific packs
  const templatePacks = packs?.filter((p) => p.is_template) || [];
  const contextPacks = packs?.filter((p) => !p.is_template) || [];

  return (
    <div className="space-y-8">
      {/* Context-Specific Packs */}
      {contextPacks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-200">
                Your Packs
              </h3>
              <p className="text-neutral-500 text-xs mt-1">
                Custom packs for this context
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Pack
            </Button>
          </div>

          <div className="space-y-3">
            {contextPacks.map((pack) => {
              const packStatus = pack.user_status || pack.status;
              const packBriefs =
                summary?.agent_pack?.briefs?.filter(
                  (b: { pack_id: string }) => b.pack_id === pack.id
                ) || [];

              return (
                <Card
                  key={pack.id}
                  className="bg-surface-elevated border-0 rounded-2xl"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{pack.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-neutral-200">
                          {pack.name}
                        </h3>
                        <span
                          className={`text-xs ${
                            packStatus === "active"
                              ? "text-accent"
                              : "text-neutral-400"
                          }`}
                        >
                          {packStatus === "active" ? "Active" : "Available"}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/design-lab/brief/create/${pack.id}`)
                        }
                        className="text-xs border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg h-7 px-2"
                      >
                        + New Brief
                      </Button>
                    </div>

                    {packBriefs.length > 0 && (
                      <div className="space-y-2">
                        {packBriefs.map(
                          (brief: {
                            id: string;
                            name: string;
                            slug?: string;
                          }) => (
                            <div
                              key={brief.id}
                              className="flex items-center justify-between bg-surface rounded-lg p-3 cursor-pointer hover:bg-surface/80 transition-colors"
                              onClick={() =>
                                navigate(
                                  brief.slug
                                    ? `/design-lab/brief/${brief.slug}`
                                    : `/design-lab/context/agent-pack`
                                )
                              }
                            >
                              <span className="text-sm text-neutral-300">
                                {brief.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/design-lab/execute/${brief.id}`);
                                  }}
                                  className="text-xs text-accent hover:text-accent/80 h-6 px-2 rounded-md"
                                >
                                  Generate →
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(brief.id);
                                  }}
                                  className={`text-xs h-6 px-2 rounded-md ${
                                    confirmDeleteId === brief.id
                                      ? "text-red-400 hover:text-red-300"
                                      : "text-neutral-500 hover:text-neutral-300"
                                  }`}
                                >
                                  {confirmDeleteId === brief.id
                                    ? "Confirm"
                                    : "Delete"}
                                </Button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {packBriefs.length === 0 && (
                      <p className="text-xs text-neutral-600 italic">
                        No briefs created yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Template Packs */}
      {templatePacks.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">
              Template Packs
            </h3>
            <p className="text-neutral-500 text-xs mt-1">
              Clone these templates to customize for this context
            </p>
          </div>

          <div className="space-y-3">
            {templatePacks.map((pack) => (
              <Card
                key={pack.id}
                className="bg-surface border border-neutral-700 rounded-2xl"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{pack.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-neutral-200">
                        {pack.name}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        {pack.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClonePack(pack.id, pack.name)}
                      disabled={cloningPackId === pack.id}
                      className="text-xs border-accent text-accent hover:bg-accent/10 rounded-lg h-8 px-3"
                    >
                      {cloningPackId === pack.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Clone to Context
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {contextPacks.length === 0 && templatePacks.length === 0 && (
        <p className="text-neutral-500 text-sm italic py-4 text-center">
          No Agent Packs available. Create your first pack or clone a template.
        </p>
      )}
    </div>
  );
}
