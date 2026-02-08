import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useBrief } from "@/hooks/useBriefs";
import { usePacks } from "@/hooks/usePacks";
import { useStartExecution, streamExecution } from "@/hooks/useExecute";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  Sparkles,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { SSEEvent } from "@/hooks/useExecute";

interface ExecuteProps {
  briefId: string;
}

interface AgentStatus {
  name: string;
  role?: string;
  status: "pending" | "running" | "completed";
  tokens?: number;
}

export default function Execute({ briefId }: ExecuteProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: brief, isLoading: briefLoading } = useBrief(briefId);
  const { data: packs } = usePacks();
  const startExecution = useStartExecution();

  const [topic, setTopic] = useState("");
  const [phase, setPhase] = useState<
    "input" | "running" | "completed" | "error"
  >("input");
  const [progress, setProgress] = useState(0);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [outputId, setOutputId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const streamingRef = useRef(false);

  const pack = packs?.find(
    (p: { id: string }) => brief && p.id === brief.pack_id
  );

  const handleGenerate = useCallback(async () => {
    if (!topic.trim() || !briefId) return;
    if (streamingRef.current) return;

    setPhase("running");
    setProgress(0);
    setAgents([]);
    setTotalTokens(0);
    setOutputId(null);
    setErrorMessage(null);
    streamingRef.current = true;

    try {
      // Start execution → get run_id
      const { run_id } = await startExecution.mutateAsync({
        brief_id: briefId,
        topic: topic.trim(),
      });

      // Stream SSE events
      await streamExecution(
        run_id,
        (event: SSEEvent) => {
          switch (event.type) {
            case "status":
              // Run started
              break;

            case "progress":
              setProgress(event.data.progress || 0);
              if (event.data.step) {
                setAgents((prev) => {
                  // Mark previous as completed if any
                  const updated = prev.map((a) =>
                    a.status === "running"
                      ? { ...a, status: "completed" as const }
                      : a
                  );
                  // Add new agent as running
                  const exists = updated.find(
                    (a) => a.name === event.data.step
                  );
                  if (!exists) {
                    updated.push({
                      name: event.data.step!,
                      role: event.data.agent,
                      status: "running",
                    });
                  }
                  return updated;
                });
              }
              break;

            case "agent_complete":
              if (event.data.agent) {
                setAgents((prev) =>
                  prev.map((a) =>
                    a.name === event.data.agent
                      ? {
                          ...a,
                          status: "completed" as const,
                          tokens: event.data.tokens,
                        }
                      : a
                  )
                );
              }
              setTotalTokens((prev) => prev + (event.data.tokens || 0));
              break;

            case "completed":
              setProgress(100);
              setOutputId(event.data.output_id || null);
              setDuration(event.data.duration_seconds || null);
              setTotalTokens(event.data.total_tokens || 0);
              setPhase("completed");
              // Mark all agents as completed
              setAgents((prev) =>
                prev.map((a) => ({ ...a, status: "completed" as const }))
              );
              // Invalidate outputs queries
              queryClient.invalidateQueries({ queryKey: ["outputs"] });
              break;

            case "error":
              setErrorMessage(event.data.error || "Errore sconosciuto");
              setPhase("error");
              break;
          }
        },
        (error: Error) => {
          setErrorMessage(error.message);
          setPhase("error");
        }
      );
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Errore nell'avvio";
      setErrorMessage(msg);
      setPhase("error");
      toast({
        title: "Errore",
        description: msg,
        variant: "destructive",
      });
    } finally {
      streamingRef.current = false;
    }
  }, [topic, briefId, startExecution, queryClient, toast]);

  if (briefLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Brief non trovato</p>
        <Button
          variant="ghost"
          onClick={() => navigate("/design-lab")}
          className="mt-4 text-accent"
        >
          Torna alla Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/design-lab/brief/${brief.slug}`)}
          className="text-neutral-400 hover:text-neutral-200 hover:bg-surface-elevated rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {brief.name}
        </Button>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          {pack && <span className="text-xl">{pack.icon}</span>}
          <span className="text-xs text-neutral-500 uppercase tracking-wide">
            {pack?.name || "Pack"} — {brief.name}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-100">
          Genera Contenuto
        </h1>
      </div>

      {/* === Phase: Input === */}
      {phase === "input" && (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-6">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Topic / Argomento
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Es. Come usare l'AI nel content marketing nel 2026"
              className="bg-surface border-neutral-700 text-neutral-100 h-12 rounded-xl mb-4"
              onKeyDown={(e) =>
                e.key === "Enter" && topic.trim() && handleGenerate()
              }
              autoFocus
            />
            <Button
              onClick={handleGenerate}
              disabled={!topic.trim() || startExecution.isPending}
              className="w-full bg-accent hover:bg-accent/90 text-black font-medium rounded-xl h-11"
            >
              {startExecution.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Genera
            </Button>
          </CardContent>
        </Card>
      )}

      {/* === Phase: Running === */}
      {phase === "running" && (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-neutral-100 mb-1">
                Generazione in corso...
              </h2>
              <p className="text-sm text-neutral-400">
                Topic: {topic}
              </p>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-neutral-500 mb-2">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Agent list */}
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="flex items-center gap-3 text-sm"
                >
                  {agent.status === "completed" ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : agent.status === "running" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-accent flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                  )}
                  <span
                    className={
                      agent.status === "completed"
                        ? "text-neutral-300"
                        : agent.status === "running"
                        ? "text-neutral-100 font-medium"
                        : "text-neutral-500"
                    }
                  >
                    {agent.role || agent.name}
                  </span>
                  <span className="text-neutral-600 text-xs ml-auto">
                    {agent.status === "completed"
                      ? "completato"
                      : agent.status === "running"
                      ? "in esecuzione..."
                      : "in attesa"}
                  </span>
                  {agent.tokens && (
                    <span className="text-neutral-600 text-xs">
                      {agent.tokens.toLocaleString()} tok
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Tokens counter */}
            {totalTokens > 0 && (
              <p className="text-xs text-neutral-500 text-center">
                Token usati: {totalTokens.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* === Phase: Completed === */}
      {phase === "completed" && (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-neutral-100">
              Contenuto generato!
            </h2>
            <p className="text-sm text-neutral-400">
              {duration && `${duration.toFixed(1)}s`}
              {totalTokens > 0 &&
                ` — ${totalTokens.toLocaleString()} token utilizzati`}
            </p>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center">
              <Button
                onClick={() => {
                  setPhase("input");
                  setTopic("");
                }}
                variant="outline"
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-xl h-11"
              >
                Genera un altro
              </Button>
              {outputId && (
                <Button
                  onClick={() =>
                    navigate(
                      `/design-lab/outputs/${pack?.slug || "unknown"}/${outputId}`
                    )
                  }
                  className="bg-accent hover:bg-accent/90 text-black font-medium rounded-xl h-11"
                >
                  Vedi contenuto
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Phase: Error === */}
      {phase === "error" && (
        <Card className="bg-surface-elevated border-0 rounded-2xl border-red-900/30">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-neutral-100">
              Errore nella generazione
            </h2>
            <p className="text-sm text-red-400">{errorMessage}</p>

            <Button
              onClick={() => {
                setPhase("input");
                setErrorMessage(null);
              }}
              variant="outline"
              className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-xl h-11"
            >
              Riprova
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
