import { useState } from "react";
import type { BriefSettings, AgentOverride } from "@/types/design-lab";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";

// ── Provider → Models map ──
const PROVIDER_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini"],
  anthropic: ["claude-sonnet-4-5-20250929", "claude-3-opus-20240229"],
  google: ["gemini-2.0-flash", "gemini-1.5-pro"],
};

const PROVIDERS = Object.keys(PROVIDER_MODELS);

interface AgentConfig {
  name: string;
  prompt: string;
  provider?: string;
  model?: string;
}

interface BriefSettingsPanelProps {
  agents: AgentConfig[];
  packDefaults: { provider: string; model: string };
  settings: BriefSettings;
  onChange: (settings: BriefSettings) => void;
}

function getOverride(
  settings: BriefSettings,
  agentName: string
): AgentOverride {
  return settings.agent_overrides?.[agentName] ?? {};
}

function hasAnyOverride(override: AgentOverride): boolean {
  return !!(
    override.prompt_append ||
    override.prompt_replace ||
    override.model ||
    override.provider ||
    override.temperature != null
  );
}

export default function BriefSettingsPanel({
  agents,
  packDefaults,
  settings,
  onChange,
}: BriefSettingsPanelProps) {
  const [openAgents, setOpenAgents] = useState<Record<string, boolean>>({});

  const toggleAgent = (name: string) => {
    setOpenAgents((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Update a single agent's override
  const updateAgentOverride = (
    agentName: string,
    patch: Partial<AgentOverride>
  ) => {
    const current = getOverride(settings, agentName);
    const updated = { ...current, ...patch };

    // Clean null-ish fields
    const cleaned: AgentOverride = {};
    if (updated.prompt_append) cleaned.prompt_append = updated.prompt_append;
    if (updated.prompt_replace) cleaned.prompt_replace = updated.prompt_replace;
    if (updated.model) cleaned.model = updated.model;
    if (updated.provider) cleaned.provider = updated.provider;
    if (updated.temperature != null) cleaned.temperature = updated.temperature;

    const newOverrides = { ...(settings.agent_overrides ?? {}) };
    if (hasAnyOverride(cleaned)) {
      newOverrides[agentName] = cleaned;
    } else {
      delete newOverrides[agentName];
    }

    onChange({
      ...settings,
      agent_overrides: Object.keys(newOverrides).length > 0 ? newOverrides : undefined,
    });
  };

  const resetAgentOverride = (agentName: string) => {
    const newOverrides = { ...(settings.agent_overrides ?? {}) };
    delete newOverrides[agentName];
    onChange({
      ...settings,
      agent_overrides: Object.keys(newOverrides).length > 0 ? newOverrides : undefined,
    });
  };

  // Prompt strategy for an agent
  const getPromptStrategy = (override: AgentOverride): "none" | "append" | "replace" => {
    if (override.prompt_replace) return "replace";
    if (override.prompt_append) return "append";
    return "none";
  };

  return (
    <div className="space-y-6">
      {/* ── Global Instructions ── */}
      <div>
        <Label className="text-neutral-200 text-sm font-medium">
          Global Instructions
        </Label>
        <p className="text-xs text-neutral-500 mt-1 mb-3">
          Added to ALL agents' prompts. Use for brand voice, style rules, or constraints.
        </p>
        <Textarea
          value={settings.global_instructions ?? ""}
          onChange={(e) =>
            onChange({
              ...settings,
              global_instructions: e.target.value || null,
            })
          }
          placeholder="e.g. Always use a professional tone. Target audience: B2B executives..."
          className="bg-surface border-neutral-700 text-neutral-100 rounded-xl min-h-[80px]"
        />
      </div>

      {/* ── Agent Overrides ── */}
      {agents.length > 0 && (
        <div>
          <Label className="text-neutral-200 text-sm font-medium">
            Agent Overrides
          </Label>
          <p className="text-xs text-neutral-500 mt-1 mb-3">
            Customize individual agents. Unopened agents use pack defaults.
          </p>

          <div className="space-y-2">
            {agents.map((agent) => {
              const override = getOverride(settings, agent.name);
              const isOpen = openAgents[agent.name] ?? false;
              const hasOverride = hasAnyOverride(override);
              const strategy = getPromptStrategy(override);

              return (
                <Collapsible
                  key={agent.name}
                  open={isOpen}
                  onOpenChange={() => toggleAgent(agent.name)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        hasOverride
                          ? "border-accent/40 bg-accent/5"
                          : "border-neutral-700 hover:border-neutral-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-neutral-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        )}
                        <span className="text-sm font-medium text-neutral-200">
                          {agent.name}
                        </span>
                        {hasOverride && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                            customized
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-500">
                        {hasOverride
                          ? ""
                          : `${packDefaults.provider} / ${packDefaults.model}`}
                      </span>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="mt-2 p-4 rounded-xl bg-surface border border-neutral-700/50 space-y-5">
                      {/* Prompt strategy */}
                      <div>
                        <Label className="text-xs text-neutral-400 uppercase tracking-wide">
                          Prompt Override
                        </Label>
                        <RadioGroup
                          value={strategy}
                          onValueChange={(v) => {
                            if (v === "none") {
                              updateAgentOverride(agent.name, {
                                prompt_append: null,
                                prompt_replace: null,
                              });
                            } else if (v === "append") {
                              updateAgentOverride(agent.name, {
                                prompt_replace: null,
                                prompt_append: override.prompt_append || "",
                              });
                            } else if (v === "replace") {
                              updateAgentOverride(agent.name, {
                                prompt_append: null,
                                prompt_replace: override.prompt_replace || "",
                              });
                            }
                          }}
                          className="mt-2"
                        >
                          <label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="none" />
                            <span className="text-sm text-neutral-300">
                              Use pack default
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="append" />
                            <span className="text-sm text-neutral-300">
                              Append to prompt
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <RadioGroupItem value="replace" />
                            <span className="text-sm text-neutral-300">
                              Replace prompt entirely
                            </span>
                          </label>
                        </RadioGroup>

                        {strategy === "append" && (
                          <Textarea
                            value={override.prompt_append ?? ""}
                            onChange={(e) =>
                              updateAgentOverride(agent.name, {
                                prompt_append: e.target.value || null,
                              })
                            }
                            placeholder="Additional instructions appended after the base prompt..."
                            className="mt-3 bg-surface-elevated border-neutral-700 text-neutral-100 rounded-xl min-h-[80px] text-sm"
                          />
                        )}

                        {strategy === "replace" && (
                          <Textarea
                            value={override.prompt_replace ?? ""}
                            onChange={(e) =>
                              updateAgentOverride(agent.name, {
                                prompt_replace: e.target.value || null,
                              })
                            }
                            placeholder="Complete replacement prompt for this agent..."
                            className="mt-3 bg-surface-elevated border-neutral-700 text-neutral-100 rounded-xl min-h-[80px] text-sm"
                          />
                        )}
                      </div>

                      {/* Provider + Model */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-neutral-400 uppercase tracking-wide">
                            Provider
                          </Label>
                          <Select
                            value={override.provider ?? ""}
                            onValueChange={(v) => {
                              const newProvider = v || null;
                              // Reset model when provider changes
                              updateAgentOverride(agent.name, {
                                provider: newProvider,
                                model: null,
                              });
                            }}
                          >
                            <SelectTrigger className="mt-1.5 h-9 text-sm">
                              <SelectValue
                                placeholder={packDefaults.provider}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {PROVIDERS.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs text-neutral-400 uppercase tracking-wide">
                            Model
                          </Label>
                          <Select
                            value={override.model ?? ""}
                            onValueChange={(v) =>
                              updateAgentOverride(agent.name, {
                                model: v || null,
                              })
                            }
                          >
                            <SelectTrigger className="mt-1.5 h-9 text-sm">
                              <SelectValue
                                placeholder={packDefaults.model}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                PROVIDER_MODELS[
                                  override.provider ?? packDefaults.provider
                                ] ?? PROVIDER_MODELS[packDefaults.provider]
                              ).map((m) => (
                                <SelectItem key={m} value={m}>
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Temperature */}
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-neutral-400 uppercase tracking-wide">
                            Temperature
                          </Label>
                          <span className="text-xs text-neutral-400 tabular-nums">
                            {override.temperature != null
                              ? override.temperature.toFixed(1)
                              : "default (0.7)"}
                          </span>
                        </div>
                        <Slider
                          value={[override.temperature ?? 0.7]}
                          onValueChange={([v]) =>
                            updateAgentOverride(agent.name, {
                              temperature: Math.round(v * 10) / 10,
                            })
                          }
                          min={0}
                          max={1.5}
                          step={0.1}
                          className="mt-2"
                        />
                        <div className="flex justify-between text-[10px] text-neutral-600 mt-1">
                          <span>Precise (0)</span>
                          <span>Creative (1.5)</span>
                        </div>
                      </div>

                      {/* Reset button */}
                      {hasOverride && (
                        <div className="flex justify-end pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => resetAgentOverride(agent.name)}
                            className="text-xs text-neutral-500 hover:text-neutral-300"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reset to defaults
                          </Button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
