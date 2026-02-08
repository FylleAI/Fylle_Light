import { useLocation } from "wouter";
import { usePacks } from "@/hooks/usePacks";
import { useContextSummary } from "@/hooks/useContexts";
import { useDeleteBrief } from "@/hooks/useBriefs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function AgentPackList() {
  const [, navigate] = useLocation();
  const { data: packs, isLoading: packsLoading } = usePacks();
  const { data: summary } = useContextSummary();
  const deleteBrief = useDeleteBrief();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
        Nessun Agent Pack configurato.
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

  return (
    <div className="space-y-6">
      <p className="text-neutral-400 text-sm">
        I tuoi Agent Pack attivi con i brief associati.
      </p>

      <div className="space-y-4">
        {packs.map((pack) => {
          const packStatus =
            (pack as { user_status?: string }).user_status || pack.status;
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
                          : packStatus === "available"
                          ? "text-neutral-400"
                          : "text-neutral-600"
                      }`}
                    >
                      {packStatus === "active"
                        ? "Attivo"
                        : packStatus === "available"
                        ? "Disponibile"
                        : "Coming Soon"}
                    </span>
                  </div>
                  {packStatus === "available" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/design-lab/brief/create/${pack.id}`)
                      }
                      className="text-xs border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg h-7 px-2"
                    >
                      Attiva →
                    </Button>
                  )}
                  {packStatus === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/design-lab/brief/create/${pack.id}`)
                      }
                      className="text-xs border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg h-7 px-2"
                    >
                      + Nuovo Brief
                    </Button>
                  )}
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
                              Genera →
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
                                ? "Conferma"
                                : "Elimina"}
                            </Button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {packBriefs.length === 0 && packStatus === "active" && (
                  <p className="text-xs text-neutral-600 italic">
                    Nessun brief creato per questo pack
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
