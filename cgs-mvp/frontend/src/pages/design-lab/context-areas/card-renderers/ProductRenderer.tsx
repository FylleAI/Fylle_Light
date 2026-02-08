import { Card, CardContent } from "@/components/ui/card";

interface ProductContent {
  valueProposition?: string;
  features?: string[];
  differentiators?: string[];
  useCases?: string[];
  performanceMetrics?: { metric: string; value: string }[];
}

interface Props {
  title: string;
  content: ProductContent;
}

export default function ProductRenderer({ title, content }: Props) {
  return (
    <Card className="bg-surface-elevated border-0 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📦</span>
          <h3 className="text-sm font-medium text-neutral-200">{title}</h3>
        </div>

        {content.valueProposition && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
              Value Proposition
            </h4>
            <p className="text-sm text-neutral-300">{content.valueProposition}</p>
          </div>
        )}

        {content.features && content.features.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Features
            </h4>
            <ul className="space-y-1">
              {content.features.map((f, i) => (
                <li key={i} className="text-sm text-neutral-300 flex items-start">
                  <span className="text-neutral-600 mr-2">•</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.differentiators && content.differentiators.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Differenziatori
            </h4>
            <div className="flex flex-wrap gap-2">
              {content.differentiators.map((d, i) => (
                <span
                  key={i}
                  className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {content.useCases && content.useCases.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Casi d'uso
            </h4>
            <ul className="space-y-1">
              {content.useCases.map((u, i) => (
                <li key={i} className="text-sm text-neutral-300 flex items-start">
                  <span className="text-neutral-600 mr-2">•</span>
                  {u}
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.performanceMetrics && content.performanceMetrics.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Metriche
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {content.performanceMetrics.map((m, i) => (
                <div key={i} className="bg-surface rounded-lg p-2">
                  <p className="text-xs text-neutral-500">{m.metric}</p>
                  <p className="text-sm font-medium text-neutral-200">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
