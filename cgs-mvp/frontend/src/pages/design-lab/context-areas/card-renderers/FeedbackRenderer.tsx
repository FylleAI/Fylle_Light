import { Card, CardContent } from "@/components/ui/card";

interface FeedbackContent {
  source?: "customer_feedback" | "team_feedback" | "ab_test" | "analytics" | "other";
  summary?: string;
  details?: string;
  actionItems?: string[];
  priority?: "high" | "medium" | "low";
}

interface Props {
  title: string;
  content: FeedbackContent;
}

const sourceLabels: Record<string, string> = {
  customer_feedback: "Customers",
  team_feedback: "Team",
  ab_test: "A/B Test",
  analytics: "Analytics",
  other: "Other",
};

const priorityStyles: Record<string, string> = {
  high: "bg-red-500/10 text-red-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-green-500/10 text-green-400",
};

export default function FeedbackRenderer({ title, content }: Props) {
  return (
    <Card className="bg-surface-elevated border-0 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <h3 className="text-sm font-medium text-neutral-200">{title}</h3>
          </div>
          <div className="flex gap-2">
            {content.source && (
              <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full">
                {sourceLabels[content.source] || content.source}
              </span>
            )}
            {content.priority && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full ${
                  priorityStyles[content.priority] || ""
                }`}
              >
                {content.priority}
              </span>
            )}
          </div>
        </div>

        {content.summary && (
          <p className="text-sm text-neutral-300">{content.summary}</p>
        )}

        {content.details && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
              Details
            </h4>
            <p className="text-sm text-neutral-400 whitespace-pre-wrap">
              {content.details}
            </p>
          </div>
        )}

        {content.actionItems && content.actionItems.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Action Items
            </h4>
            <ul className="space-y-1">
              {content.actionItems.map((a, i) => (
                <li key={i} className="text-sm text-neutral-300 flex items-start">
                  <span className="text-accent mr-2">→</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
