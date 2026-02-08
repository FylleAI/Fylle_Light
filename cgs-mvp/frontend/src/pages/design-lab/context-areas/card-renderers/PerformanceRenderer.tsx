import { Card, CardContent } from "@/components/ui/card";

interface PerformanceContent {
  period?: string;
  metrics?: {
    channel: string;
    contentType: string;
    ctr?: number;
    engagement?: number;
    conversions?: number;
    impressions?: number;
  }[];
  topPerformingContent?: { title: string; type: string; metric: string; value: string }[];
  insights?: string[];
}

interface Props {
  title: string;
  content: PerformanceContent;
}

export default function PerformanceRenderer({ title, content }: Props) {
  return (
    <Card className="bg-surface-elevated border-0 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <div>
            <h3 className="text-sm font-medium text-neutral-200">{title}</h3>
            {content.period && (
              <p className="text-xs text-neutral-500">{content.period}</p>
            )}
          </div>
        </div>

        {content.metrics && content.metrics.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Metrics by Channel
            </h4>
            <div className="space-y-2">
              {content.metrics.map((m, i) => (
                <div key={i} className="bg-surface rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-300">
                      {m.channel}
                    </span>
                    <span className="text-xs text-neutral-500">{m.contentType}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {m.ctr !== undefined && (
                      <div>
                        <p className="text-xs text-neutral-500">CTR</p>
                        <p className="text-sm text-neutral-200">{m.ctr}%</p>
                      </div>
                    )}
                    {m.engagement !== undefined && (
                      <div>
                        <p className="text-xs text-neutral-500">Engagement</p>
                        <p className="text-sm text-neutral-200">{m.engagement}%</p>
                      </div>
                    )}
                    {m.conversions !== undefined && (
                      <div>
                        <p className="text-xs text-neutral-500">Conv.</p>
                        <p className="text-sm text-neutral-200">{m.conversions}</p>
                      </div>
                    )}
                    {m.impressions !== undefined && (
                      <div>
                        <p className="text-xs text-neutral-500">Impr.</p>
                        <p className="text-sm text-neutral-200">
                          {m.impressions.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.topPerformingContent && content.topPerformingContent.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Top Content
            </h4>
            <div className="space-y-1">
              {content.topPerformingContent.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-surface rounded-lg p-2"
                >
                  <div>
                    <p className="text-sm text-neutral-300">{c.title}</p>
                    <p className="text-xs text-neutral-500">{c.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-accent">{c.value}</p>
                    <p className="text-xs text-neutral-500">{c.metric}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.insights && content.insights.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Insights
            </h4>
            <ul className="space-y-1">
              {content.insights.map((ins, i) => (
                <li key={i} className="text-sm text-amber-400/80 flex items-start">
                  <span className="mr-2">*</span>
                  {ins}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
