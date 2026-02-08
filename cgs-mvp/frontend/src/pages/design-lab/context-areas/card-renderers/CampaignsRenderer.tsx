import { Card, CardContent } from "@/components/ui/card";

interface CampaignsContent {
  objective?: string;
  keyMessages?: string[];
  tone?: string;
  assets?: { name: string; type: string; status: string }[];
  results?: { metric: string; value: string; trend?: "up" | "down" | "stable" }[];
  learnings?: string[];
}

interface Props {
  title: string;
  content: CampaignsContent;
}

const trendIcon = (trend?: string) => {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
};

const trendColor = (trend?: string) => {
  if (trend === "up") return "text-green-400";
  if (trend === "down") return "text-red-400";
  return "text-neutral-400";
};

export default function CampaignsRenderer({ title, content }: Props) {
  return (
    <Card className="bg-surface-elevated border-0 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📢</span>
          <h3 className="text-sm font-medium text-neutral-200">{title}</h3>
        </div>

        {content.objective && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
              Obiettivo
            </h4>
            <p className="text-sm text-neutral-300">{content.objective}</p>
          </div>
        )}

        {content.tone && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
              Tono
            </h4>
            <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full">
              {content.tone}
            </span>
          </div>
        )}

        {content.keyMessages && content.keyMessages.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Messaggi Chiave
            </h4>
            <ul className="space-y-1">
              {content.keyMessages.map((m, i) => (
                <li key={i} className="text-sm text-neutral-300 flex items-start">
                  <span className="text-neutral-600 mr-2">•</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.results && content.results.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Risultati
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {content.results.map((r, i) => (
                <div key={i} className="bg-surface rounded-lg p-2">
                  <p className="text-xs text-neutral-500">{r.metric}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-neutral-200">{r.value}</p>
                    <span className={`text-xs ${trendColor(r.trend)}`}>
                      {trendIcon(r.trend)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.learnings && content.learnings.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Learnings
            </h4>
            <ul className="space-y-1">
              {content.learnings.map((l, i) => (
                <li key={i} className="text-sm text-amber-400/80 flex items-start">
                  <span className="mr-2">*</span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
