import { useCards } from "@/hooks/useCards";
import { Loader2 } from "lucide-react";
import { CardType, CardTypeLabels, CardTypeIcons } from "@/types/cards";
import ProductRenderer from "./card-renderers/ProductRenderer";
import TargetRenderer from "./card-renderers/TargetRenderer";
import CampaignsRenderer from "./card-renderers/CampaignsRenderer";
import TopicRenderer from "./card-renderers/TopicRenderer";
import PerformanceRenderer from "./card-renderers/PerformanceRenderer";
import FeedbackRenderer from "./card-renderers/FeedbackRenderer";

const OPERATIVE_TYPES: CardType[] = [
  CardType.PRODUCT,
  CardType.TARGET,
  CardType.CAMPAIGNS,
  CardType.TOPIC,
  CardType.PERFORMANCE,
  CardType.FEEDBACK,
];

const rendererMap: Record<string, React.ComponentType<{ title: string; content: Record<string, unknown> }>> = {
  [CardType.PRODUCT]: ProductRenderer as React.ComponentType<{ title: string; content: Record<string, unknown> }>,
  [CardType.TARGET]: TargetRenderer as React.ComponentType<{ title: string; content: Record<string, unknown> }>,
  [CardType.CAMPAIGNS]: CampaignsRenderer as React.ComponentType<{ title: string; content: Record<string, unknown> }>,
  [CardType.TOPIC]: TopicRenderer as React.ComponentType<{ title: string; content: Record<string, unknown> }>,
  [CardType.PERFORMANCE]: PerformanceRenderer as React.ComponentType<{ title: string; content: Record<string, unknown> }>,
  [CardType.FEEDBACK]: FeedbackRenderer as React.ComponentType<{ title: string; content: Record<string, unknown> }>,
};

export default function ContextOperativo() {
  const { cards, isLoading } = useCards();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  const operativeCards = cards.filter((c) =>
    OPERATIVE_TYPES.includes(c.card_type as CardType)
  );

  if (operativeCards.length === 0) {
    return (
      <p className="text-neutral-500 text-sm italic py-4">
        No operational cards available. Cards are created during onboarding.
      </p>
    );
  }

  const grouped = OPERATIVE_TYPES.map((type) => ({
    type,
    label: CardTypeLabels[type],
    icon: CardTypeIcons[type],
    items: operativeCards.filter((c) => c.card_type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      <p className="text-neutral-400 text-sm">
        Operational cards: product, target, campaigns, topics, performance and feedback.
      </p>

      {grouped.map((group) => (
        <div key={group.type} className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{group.icon}</span>
            <h3 className="text-sm font-medium text-neutral-300">
              {group.label} ({group.items.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.items.map((card) => {
              const Renderer = rendererMap[card.card_type];
              if (!Renderer) return null;
              return (
                <Renderer
                  key={card.id}
                  title={card.title || CardTypeLabels[card.card_type as CardType] || card.card_type}
                  content={card.content as Record<string, unknown>}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
