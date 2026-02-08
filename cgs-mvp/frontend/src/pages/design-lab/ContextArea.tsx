import { useLocation } from "wouter";
import { useContext as useContextData, useContextSummary } from "@/hooks/useContexts";
import { useCards } from "@/hooks/useCards";
import { usePacks } from "@/hooks/usePacks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  CardType,
  CardTypeLabels,
  CardTypeIcons,
} from "@/types/cards";
import { CONTEXT_AREAS } from "@/types/design-lab";

interface ContextAreaProps {
  areaId: string;
}

export default function ContextArea({ areaId }: ContextAreaProps) {
  const [, navigate] = useLocation();
  const { data: context, isLoading: contextLoading } = useContextData();
  const { data: summary } = useContextSummary();
  const { cards, isLoading: cardsLoading } = useCards();
  const { data: packs } = usePacks();

  const area = CONTEXT_AREAS.find((a) => a.id === areaId);
  const isLoading = contextLoading || cardsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  const renderJsonData = (
    data: Record<string, unknown> | unknown,
    label?: string
  ) => {
    if (!data || (typeof data === "object" && Object.keys(data as object).length === 0)) {
      return (
        <p className="text-neutral-500 text-sm italic">Nessun dato disponibile</p>
      );
    }

    // Render structured data nicely
    if (typeof data === "object" && data !== null) {
      return (
        <div className="space-y-3">
          {label && (
            <h3 className="text-xs text-neutral-500 uppercase tracking-wide">
              {label}
            </h3>
          )}
          {Object.entries(data as Record<string, unknown>).map(
            ([key, value]) => (
              <div key={key} className="bg-surface-elevated rounded-xl p-4">
                <h4 className="text-xs text-neutral-400 uppercase tracking-wide mb-1">
                  {key.replace(/_/g, " ")}
                </h4>
                {typeof value === "string" ? (
                  <p className="text-neutral-200 text-sm whitespace-pre-wrap">
                    {value}
                  </p>
                ) : Array.isArray(value) ? (
                  <ul className="space-y-1">
                    {value.map((item, i) => (
                      <li
                        key={i}
                        className="text-neutral-300 text-sm flex items-start"
                      >
                        <span className="text-neutral-600 mr-2">•</span>
                        {typeof item === "string"
                          ? item
                          : JSON.stringify(item)}
                      </li>
                    ))}
                  </ul>
                ) : typeof value === "object" && value !== null ? (
                  <pre className="text-neutral-400 text-xs overflow-auto">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <p className="text-neutral-200 text-sm">{String(value)}</p>
                )}
              </div>
            )
          )}
        </div>
      );
    }

    return <p className="text-neutral-200 text-sm">{String(data)}</p>;
  };

  const renderCardsForTypes = (types: CardType[]) => {
    const filtered = cards.filter((c) =>
      types.includes(c.card_type as CardType)
    );

    if (filtered.length === 0) {
      return (
        <p className="text-neutral-500 text-sm italic py-4">
          Nessuna card disponibile per quest'area
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((card) => {
          const type = card.card_type as CardType;
          return (
            <Card
              key={card.id}
              className="bg-surface-elevated border-0 rounded-2xl"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">
                    {CardTypeIcons[type] || "📋"}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-200">
                      {card.title || CardTypeLabels[type] || type}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {CardTypeLabels[type] || type}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-neutral-400">
                  {card.content &&
                  typeof card.content === "object" &&
                  Object.keys(card.content).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(card.content)
                        .slice(0, 3)
                        .map(([k, v]) => (
                          <div key={k}>
                            <span className="text-xs text-neutral-500 uppercase">
                              {k.replace(/([A-Z])/g, " $1").trim()}:{" "}
                            </span>
                            <span className="text-neutral-300">
                              {typeof v === "string"
                                ? v.length > 80
                                  ? v.slice(0, 80) + "..."
                                  : v
                                : Array.isArray(v)
                                ? `${v.length} items`
                                : JSON.stringify(v).slice(0, 60)}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 italic">Nessun contenuto</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    switch (areaId) {
      case "fonti-informative":
        return (
          <div className="space-y-6">
            <p className="text-neutral-400 text-sm">
              Informazioni raccolte dal sito web e da fonti aziendali.
            </p>
            {renderJsonData(context?.company_info, "Informazioni Aziendali")}
          </div>
        );

      case "fonti-mercato":
        return (
          <div className="space-y-6">
            <p className="text-neutral-400 text-sm">
              Dati di mercato, trend e analisi competitor da Perplexity.
            </p>
            {renderJsonData(context?.research_data, "Ricerca di Mercato")}
            {renderCardsForTypes([CardType.COMPETITOR])}
          </div>
        );

      case "brand":
        return (
          <div className="space-y-6">
            <p className="text-neutral-400 text-sm">
              Tono di voce, linee guida stilistiche e identità visiva.
            </p>
            {renderJsonData(context?.voice_info, "Voce del Brand")}
            {renderCardsForTypes([CardType.BRAND_VOICE])}
          </div>
        );

      case "operativo":
        return (
          <div className="space-y-6">
            <p className="text-neutral-400 text-sm">
              Cards operative: prodotto, target, campagne, topic, performance e
              feedback.
            </p>
            {renderCardsForTypes([
              CardType.PRODUCT,
              CardType.TARGET,
              CardType.CAMPAIGNS,
              CardType.TOPIC,
              CardType.PERFORMANCE,
              CardType.FEEDBACK,
            ])}
          </div>
        );

      case "agent-pack":
        return (
          <div className="space-y-6">
            <p className="text-neutral-400 text-sm">
              I tuoi Agent Pack attivi con i brief associati.
            </p>
            {packs && packs.length > 0 ? (
              <div className="space-y-4">
                {packs.map((pack) => {
                  const packStatus = (pack as { user_status?: string }).user_status || pack.status;
                  const packBriefs = summary?.agent_pack?.briefs?.filter(
                    (b: { pack_id: string }) => b.pack_id === pack.id
                  ) || [];

                  return (
                    <Card
                      key={pack.id}
                      className="bg-surface-elevated border-0 rounded-2xl"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-2">
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
                              onClick={() => navigate(`/design-lab/brief/create/${pack.id}`)}
                              className="text-xs border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg h-7 px-2"
                            >
                              Attiva →
                            </Button>
                          )}
                        </div>
                        {packBriefs.map((brief: { id: string; name: string; slug?: string }) => (
                          <div
                            key={brief.id}
                            className="flex items-center justify-between bg-surface rounded-lg p-3 mt-2 cursor-pointer hover:bg-surface/80 transition-colors"
                            onClick={() =>
                              navigate(
                                brief.slug
                                  ? `/design-lab/brief/${brief.slug}`
                                  : `/design-lab/context/agent-pack`
                              )
                            }
                          >
                            <span className="text-sm text-neutral-300">
                              📝 {brief.name}
                            </span>
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
                          </div>
                        ))}
                        {packBriefs.length === 0 && packStatus === "active" && (
                          <p className="text-xs text-neutral-600 mt-2 italic">
                            Nessun brief visibile dal context summary
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm italic">
                Nessun Agent Pack configurato
              </p>
            )}
          </div>
        );

      default:
        return (
          <p className="text-neutral-500 text-sm italic">
            Area non riconosciuta: {areaId}
          </p>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/design-lab/context")}
          className="text-neutral-400 hover:text-neutral-200 hover:bg-surface-elevated rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Contesto
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-2xl">{area?.icon || "📋"}</span>
        <div>
          <h1 className="text-xl font-bold text-neutral-100">
            {area?.label || areaId}
          </h1>
          <p className="text-neutral-400 text-sm">
            {area?.description || ""}
          </p>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
