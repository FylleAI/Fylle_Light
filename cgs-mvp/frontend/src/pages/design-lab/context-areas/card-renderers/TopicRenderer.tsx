import { Card, CardContent } from "@/components/ui/card";

interface TopicContent {
  description?: string;
  keywords?: string[];
  angles?: string[];
  relatedContent?: { title: string; type: string; url?: string }[];
  trends?: { trend: string; relevance: "high" | "medium" | "low" }[];
}

interface Props {
  title: string;
  content: TopicContent;
}

const relevanceColor = (r: string) => {
  if (r === "high") return "bg-red-500/10 text-red-400";
  if (r === "medium") return "bg-amber-500/10 text-amber-400";
  return "bg-neutral-500/10 text-neutral-400";
};

export default function TopicRenderer({ title, content }: Props) {
  return (
    <Card className="bg-surface-elevated border-0 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <h3 className="text-sm font-medium text-neutral-200">{title}</h3>
        </div>

        {content.description && (
          <p className="text-sm text-neutral-300">{content.description}</p>
        )}

        {content.keywords && content.keywords.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Keywords
            </h4>
            <div className="flex flex-wrap gap-2">
              {content.keywords.map((k, i) => (
                <span
                  key={i}
                  className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {content.angles && content.angles.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Angolazioni
            </h4>
            <ul className="space-y-1">
              {content.angles.map((a, i) => (
                <li key={i} className="text-sm text-neutral-300 flex items-start">
                  <span className="text-neutral-600 mr-2">→</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.trends && content.trends.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Trend
            </h4>
            <div className="space-y-2">
              {content.trends.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${relevanceColor(t.relevance)}`}
                  >
                    {t.relevance}
                  </span>
                  <span className="text-sm text-neutral-300">{t.trend}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
