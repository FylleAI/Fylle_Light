import { useLocation } from "wouter";
import { usePacks, useClonePack, useUpdatePack } from "@/hooks/usePacks";
import { useContextSummary } from "@/hooks/useContexts";
import { useDeleteBrief } from "@/hooks/useBriefs";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Copy,
  Plus,
  Pencil,
  Save,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { AgentPack } from "@/types/design-lab";

interface PackEditState {
  name: string;
  description: string;
  icon: string;
  outcome: string;
  agents_config: Array<{ name: string; prompt: string; provider?: string; model?: string }>;
  default_llm_provider: string;
  default_llm_model: string;
}

export default function AgentPackList() {
  const [, navigate] = useLocation();
  const contextId = useAppStore((s) => s.contextId) ?? undefined;
  const { data: packs, isLoading: packsLoading } = usePacks(contextId);
  const { data: summary } = useContextSummary(contextId);
  const deleteBrief = useDeleteBrief();
  const clonePack = useClonePack();
  const updatePack = useUpdatePack();
  const { toast } = useToast();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [cloningPackId, setCloningPackId] = useState<string | null>(null);
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [editState, setEditState] = useState<PackEditState | null>(null);
  const [expandedAgents, setExpandedAgents] = useState<Record<number, boolean>>({});

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

  const startEditPack = (pack: AgentPack) => {
    setEditingPackId(pack.id);
    setEditState({
      name: pack.name || "",
      description: pack.description || "",
      icon: pack.icon || "📦",
      outcome: pack.outcome || "",
      agents_config: pack.agents_config || [],
      default_llm_provider: pack.default_llm_provider || "openai",
      default_llm_model: pack.default_llm_model || "gpt-4o",
    });
    setExpandedAgents({});
  };

  const cancelEditPack = () => {
    setEditingPackId(null);
    setEditState(null);
    setExpandedAgents({});
  };

  const updateEditField = <K extends keyof PackEditState>(
    key: K,
    value: PackEditState[K]
  ) => {
    setEditState((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateAgentField = (
    index: number,
    field: string,
    value: string
  ) => {
    setEditState((prev) => {
      if (!prev) return prev;
      const updated = [...prev.agents_config];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, agents_config: updated };
    });
  };

  const saveEditPack = () => {
    if (!editingPackId || !editState || !editState.name.trim()) return;
    updatePack.mutate(
      {
        packId: editingPackId,
        updates: {
          name: editState.name.trim(),
          description: editState.description.trim(),
          icon: editState.icon.trim(),
          outcome: editState.outcome.trim(),
          agents_config: editState.agents_config,
          default_llm_provider: editState.default_llm_provider,
          default_llm_model: editState.default_llm_model,
        },
      },
      {
        onSuccess: () => {
          cancelEditPack();
          toast({ title: "Pack updated" });
        },
        onError: (error) => {
          toast({
            title: "Update failed",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
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
              onClick={() => navigate("/design-lab/packs/manager")}
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
                  <CardContent className="p-5 space-y-0">
                    {/* ── Pack Header ── */}
                    {editingPackId === pack.id && editState ? (
                      <div className="space-y-4">
                        {/* Row 1: Icon + Name + Description */}
                        <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 block">
                              Icon
                            </label>
                            <input
                              type="text"
                              value={editState.icon}
                              onChange={(e) =>
                                updateEditField("icon", e.target.value)
                              }
                              className="w-14 bg-surface text-center text-xl rounded-lg px-2 py-1.5 border border-neutral-700 focus:border-accent/50 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 block">
                                Pack Name
                              </label>
                              <input
                                type="text"
                                value={editState.name}
                                onChange={(e) =>
                                  updateEditField("name", e.target.value)
                                }
                                className="w-full bg-surface text-neutral-200 text-sm rounded-lg px-3 py-1.5 border border-neutral-700 focus:border-accent/50 focus:outline-none"
                                placeholder="Pack name..."
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 block">
                                Description
                              </label>
                              <input
                                type="text"
                                value={editState.description}
                                onChange={(e) =>
                                  updateEditField("description", e.target.value)
                                }
                                className="w-full bg-surface text-neutral-400 text-xs rounded-lg px-3 py-1.5 border border-neutral-700 focus:border-accent/50 focus:outline-none"
                                placeholder="Description (optional)..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Outcome */}
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 block">
                            Outcome (what this pack produces)
                          </label>
                          <input
                            type="text"
                            value={editState.outcome}
                            onChange={(e) =>
                              updateEditField("outcome", e.target.value)
                            }
                            className="w-full bg-surface text-neutral-200 text-sm rounded-lg px-3 py-1.5 border border-neutral-700 focus:border-accent/50 focus:outline-none"
                            placeholder="e.g. HTML newsletter, blog article..."
                          />
                        </div>

                        {/* Row 3: LLM Settings */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 block">
                              LLM Provider
                            </label>
                            <select
                              value={editState.default_llm_provider}
                              onChange={(e) =>
                                updateEditField(
                                  "default_llm_provider",
                                  e.target.value
                                )
                              }
                              className="w-full bg-surface text-neutral-200 text-sm rounded-lg px-3 py-1.5 border border-neutral-700 focus:border-accent/50 focus:outline-none"
                            >
                              <option value="openai">OpenAI</option>
                              <option value="anthropic">Anthropic</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1 block">
                              LLM Model
                            </label>
                            <input
                              type="text"
                              value={editState.default_llm_model}
                              onChange={(e) =>
                                updateEditField(
                                  "default_llm_model",
                                  e.target.value
                                )
                              }
                              className="w-full bg-surface text-neutral-200 text-sm rounded-lg px-3 py-1.5 border border-neutral-700 focus:border-accent/50 focus:outline-none"
                              placeholder="gpt-4o"
                            />
                          </div>
                        </div>

                        {/* Row 4: Agents Config */}
                        {editState.agents_config.length > 0 && (
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2 block">
                              Agents Pipeline ({editState.agents_config.length}{" "}
                              agents)
                            </label>
                            <div className="space-y-2">
                              {editState.agents_config.map((agent, idx) => {
                                const isExpanded = expandedAgents[idx];
                                return (
                                  <div
                                    key={idx}
                                    className="bg-surface rounded-xl border border-neutral-700/50 overflow-hidden"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedAgents((prev) => ({
                                          ...prev,
                                          [idx]: !prev[idx],
                                        }))
                                      }
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-800/50 transition-colors"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                                      )}
                                      <span className="text-xs font-medium text-neutral-300">
                                        {idx + 1}. {agent.name || "Unnamed Agent"}
                                      </span>
                                      <span className="text-[10px] text-neutral-600 ml-auto">
                                        {agent.prompt?.length || 0} chars
                                      </span>
                                    </button>
                                    {isExpanded && (
                                      <div className="px-3 pb-3 space-y-2 border-t border-neutral-700/30">
                                        <div className="pt-2">
                                          <label className="text-[10px] text-neutral-500 mb-1 block">
                                            Agent Name
                                          </label>
                                          <input
                                            type="text"
                                            value={agent.name}
                                            onChange={(e) =>
                                              updateAgentField(
                                                idx,
                                                "name",
                                                e.target.value
                                              )
                                            }
                                            className="w-full bg-neutral-900 text-neutral-200 text-xs rounded-lg px-3 py-1.5 border border-neutral-700 focus:border-accent/50 focus:outline-none"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-neutral-500 mb-1 block">
                                            System Prompt
                                          </label>
                                          <textarea
                                            value={agent.prompt}
                                            onChange={(e) =>
                                              updateAgentField(
                                                idx,
                                                "prompt",
                                                e.target.value
                                              )
                                            }
                                            rows={8}
                                            className="w-full bg-neutral-900 text-neutral-200 text-xs rounded-lg px-3 py-2 resize-y border border-neutral-700 focus:border-accent/50 focus:outline-none font-mono leading-relaxed"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Save / Cancel */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={saveEditPack}
                            disabled={
                              updatePack.isPending || !editState.name.trim()
                            }
                            className="bg-accent hover:bg-accent/90 text-black font-medium rounded-lg h-7 px-3 text-xs"
                          >
                            {updatePack.isPending ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3 mr-1" />
                            )}
                            Save All
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditPack}
                            className="text-neutral-400 h-7 px-2 text-xs"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">{pack.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-neutral-200">
                              {pack.name}
                            </h3>
                            <span
                              className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                packStatus === "active"
                                  ? "bg-accent/20 text-accent"
                                  : "bg-neutral-700 text-neutral-400"
                              }`}
                            >
                              {packStatus === "active" ? "Active" : "Available"}
                            </span>
                          </div>
                          {pack.description && (
                            <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                              {pack.description}
                            </p>
                          )}
                          {pack.outcome && (
                            <p className="text-[10px] text-neutral-600 mt-1">
                              Outcome: {pack.outcome}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditPack(pack)}
                          className="text-neutral-500 hover:text-neutral-300 h-7 w-7 p-0 rounded-lg shrink-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}

                    {/* ── Divider + Briefs Section ── */}
                    <div className="border-t border-neutral-700/50 mt-4 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
                          Briefs
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/design-lab/brief/create/${pack.id}`)
                          }
                          className="text-xs border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg h-6 px-2"
                        >
                          + New Brief
                        </Button>
                      </div>

                    {packBriefs.length > 0 ? (
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
                                    navigate(
                                      brief.slug
                                        ? `/design-lab/brief/${brief.slug}/edit`
                                        : `/design-lab/context/agent-pack`
                                    );
                                  }}
                                  className="text-xs text-neutral-400 hover:text-neutral-200 h-6 px-2 rounded-md"
                                >
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
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
                    ) : (
                      <p className="text-xs text-neutral-600 italic">
                        No briefs created yet
                      </p>
                    )}
                    </div>
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
