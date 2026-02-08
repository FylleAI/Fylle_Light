import { useContext as useContextData } from "@/hooks/useContexts";
import { useCards } from "@/hooks/useCards";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { CardType } from "@/types/cards";

interface CompetitorContent {
  competitorName?: string;
  positioning?: string;
  keyMessages?: string[];
  strengths?: string[];
  weaknesses?: string[];
  differentiationOpportunities?: string[];
}

export default function FontiMercato() {
  const { data: context, isLoading: contextLoading } = useContextData();
  const { cards, isLoading: cardsLoading } = useCards();

  if (contextLoading || cardsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  const researchData = (context?.research_data || {}) as Record<string, unknown>;
  const competitors = cards.filter((c) => c.card_type === CardType.COMPETITOR);
  const hasData = Object.keys(researchData).length > 0 || competitors.length > 0;

  if (!hasData) {
    return (
      <p className="text-neutral-500 text-sm italic py-4">
        No market data available. Data is populated during onboarding.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-neutral-400 text-sm">
        Market data, trends and competitor analysis from Perplexity.
      </p>

      {Object.keys(researchData).length > 0 && (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📈</span>
              <h3 className="text-sm font-medium text-neutral-200">Market Research</h3>
            </div>
            {Object.entries(researchData).map(([key, value]) => (
              <div key={key}>
                <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  {key.replace(/_/g, " ")}
                </h4>
                {typeof value === "string" ? (
                  <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                    {value.length > 500 ? value.slice(0, 500) + "..." : value}
                  </p>
                ) : Array.isArray(value) ? (
                  <ul className="space-y-1">
                    {value.map((item, i) => (
                      <li key={i} className="text-sm text-neutral-300 flex items-start">
                        <span className="text-neutral-600 mr-2">•</span>
                        {typeof item === "string" ? item : JSON.stringify(item)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-400">{JSON.stringify(value)}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {competitors.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-300">
            Competitor ({competitors.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competitors.map((card) => {
              const c = card.content as unknown as CompetitorContent;
              return (
                <Card
                  key={card.id}
                  className="bg-surface-elevated border-0 rounded-2xl"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏆</span>
                      <h3 className="text-sm font-medium text-neutral-200">
                        {c.competitorName || card.title}
                      </h3>
                    </div>

                    {c.positioning && (
                      <p className="text-sm text-neutral-400">{c.positioning}</p>
                    )}

                    {c.strengths && c.strengths.length > 0 && (
                      <div>
                        <h4 className="text-xs text-green-400 uppercase tracking-wide mb-1">
                          Strengths
                        </h4>
                        <ul className="space-y-0.5">
                          {c.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-green-300/70 flex items-start">
                              <span className="mr-1.5">+</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {c.weaknesses && c.weaknesses.length > 0 && (
                      <div>
                        <h4 className="text-xs text-red-400 uppercase tracking-wide mb-1">
                          Weaknesses
                        </h4>
                        <ul className="space-y-0.5">
                          {c.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm text-red-300/70 flex items-start">
                              <span className="mr-1.5">-</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {c.differentiationOpportunities && c.differentiationOpportunities.length > 0 && (
                      <div>
                        <h4 className="text-xs text-amber-400 uppercase tracking-wide mb-1">
                          Opportunities
                        </h4>
                        <ul className="space-y-0.5">
                          {c.differentiationOpportunities.map((d, i) => (
                            <li key={i} className="text-sm text-amber-300/70 flex items-start">
                              <span className="mr-1.5">→</span>
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
