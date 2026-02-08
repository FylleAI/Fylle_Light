import { Card, CardContent } from "@/components/ui/card";

interface TargetContent {
  icpName?: string;
  description?: string;
  painPoints?: string[];
  goals?: string[];
  preferredLanguage?: string;
  communicationChannels?: string[];
  demographics?: {
    ageRange?: string;
    location?: string;
    role?: string;
    industry?: string;
  };
}

interface Props {
  title: string;
  content: TargetContent;
}

export default function TargetRenderer({ title, content }: Props) {
  return (
    <Card className="bg-surface-elevated border-0 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <div>
            <h3 className="text-sm font-medium text-neutral-200">{title}</h3>
            {content.icpName && (
              <p className="text-xs text-neutral-500">{content.icpName}</p>
            )}
          </div>
        </div>

        {content.description && (
          <p className="text-sm text-neutral-300">{content.description}</p>
        )}

        {content.painPoints && content.painPoints.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Pain Points
            </h4>
            <ul className="space-y-1">
              {content.painPoints.map((p, i) => (
                <li key={i} className="text-sm text-red-400/80 flex items-start">
                  <span className="mr-2">!</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.goals && content.goals.length > 0 && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Goals
            </h4>
            <ul className="space-y-1">
              {content.goals.map((g, i) => (
                <li key={i} className="text-sm text-green-400/80 flex items-start">
                  <span className="mr-2">→</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.demographics && (
          <div>
            <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
              Demographics
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {content.demographics.ageRange && (
                <div className="bg-surface rounded-lg p-2">
                  <p className="text-xs text-neutral-500">Age</p>
                  <p className="text-sm text-neutral-300">{content.demographics.ageRange}</p>
                </div>
              )}
              {content.demographics.location && (
                <div className="bg-surface rounded-lg p-2">
                  <p className="text-xs text-neutral-500">Location</p>
                  <p className="text-sm text-neutral-300">{content.demographics.location}</p>
                </div>
              )}
              {content.demographics.role && (
                <div className="bg-surface rounded-lg p-2">
                  <p className="text-xs text-neutral-500">Role</p>
                  <p className="text-sm text-neutral-300">{content.demographics.role}</p>
                </div>
              )}
              {content.demographics.industry && (
                <div className="bg-surface rounded-lg p-2">
                  <p className="text-xs text-neutral-500">Industry</p>
                  <p className="text-sm text-neutral-300">{content.demographics.industry}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {content.communicationChannels && content.communicationChannels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {content.communicationChannels.map((ch, i) => (
              <span
                key={i}
                className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full"
              >
                {ch}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
