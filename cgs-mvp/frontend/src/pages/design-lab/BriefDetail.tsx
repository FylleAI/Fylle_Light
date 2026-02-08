import { useLocation } from "wouter";
import { useBriefBySlug } from "@/hooks/useBriefs";
import { usePacks } from "@/hooks/usePacks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  FileEdit,
  Copy,
} from "lucide-react";

interface BriefDetailProps {
  briefSlug: string;
}

/** Map backend answers + questions into structured sections for display. */
function extractSections(brief: {
  answers?: Record<string, unknown>;
  questions?: unknown[];
  compiled_brief?: string;
}) {
  const sections: { label: string; value: string | string[] }[] = [];
  const answers = brief.answers || {};
  const questions = (brief.questions || []) as { id: string; question: string }[];

  // Standard field mapping
  const fieldMap: Record<string, string> = {
    tone: "Tone of Voice",
    toneOfVoice: "Tone of Voice",
    tone_of_voice: "Tone of Voice",
    objective: "Objective",
    target: "Target",
    targetAudience: "Target Audience",
    target_audience: "Target Audience",
    frequency: "Frequency",
    length: "Length",
    topics: "Topics",
    keywords: "Keywords",
    guidelines: "Guidelines",
    cta: "Call to Action",
    style: "Style",
    format: "Format",
  };

  // Build sections from answers, using question text as label when available
  for (const [key, value] of Object.entries(answers)) {
    if (!value) continue;
    const question = questions.find((q) => q.id === key);
    const label = question?.question || fieldMap[key] || key;
    const displayValue = Array.isArray(value)
      ? value
      : typeof value === "string"
      ? value
      : JSON.stringify(value);
    sections.push({ label, value: displayValue });
  }

  return sections;
}

export default function BriefDetail({ briefSlug }: BriefDetailProps) {
  const [, navigate] = useLocation();
  const { data: brief, isLoading } = useBriefBySlug(briefSlug);
  const { data: packs } = usePacks();

  // Find the pack name for display
  const pack = packs?.find(
    (p: { id: string }) => brief && p.id === brief.pack_id
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Brief not found</p>
        <Button
          variant="ghost"
          onClick={() => navigate("/design-lab")}
          className="mt-4 text-accent"
        >
          Back to Home
        </Button>
      </div>
    );
  }

  const sections = extractSections(brief);
  const statusLabel = brief.status === "active" ? "Configured" : "Draft";
  const statusColor =
    brief.status === "active" ? "text-green-400" : "text-yellow-400";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/design-lab/context/agent-pack")}
          className="text-neutral-400 hover:text-neutral-200 hover:bg-surface-elevated rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Agent Pack
        </Button>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          {pack && <span className="text-xl">{pack.icon}</span>}
          <span className="text-xs text-neutral-500 uppercase tracking-wide">
            {pack?.name || "Pack"}
          </span>
          <span className={`text-xs font-medium ${statusColor}`}>
            • {statusLabel}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-100">{brief.name}</h1>
        {brief.description && (
          <p className="text-neutral-400 text-sm mt-1">{brief.description}</p>
        )}
      </div>

      {/* Sections from answers */}
      {sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((section, i) => (
            <Card
              key={i}
              className="bg-surface-elevated border-0 rounded-2xl"
            >
              <CardContent className="p-5">
                <h3 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
                  {section.label}
                </h3>
                {Array.isArray(section.value) ? (
                  <ul className="space-y-1">
                    {section.value.map((item, j) => (
                      <li
                        key={j}
                        className="text-neutral-200 text-sm flex items-start"
                      >
                        <span className="text-neutral-600 mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-neutral-200 text-sm whitespace-pre-wrap">
                    {section.value}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : brief.compiled_brief ? (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-5">
            <h3 className="text-xs text-neutral-500 uppercase tracking-wide mb-3">
              Compiled Brief
            </h3>
            <div className="text-sm text-neutral-200 whitespace-pre-wrap">
              {brief.compiled_brief}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-8 text-center">
            <FileEdit className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-neutral-500 text-sm">
              No sections configured.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/design-lab/brief/${briefSlug}/edit`)
          }
          className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-xl h-11"
        >
          <FileEdit className="w-4 h-4 mr-2" />
          Edit Brief
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            navigate(`/design-lab/brief/create/${brief.pack_id}`)
          }
          className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-xl h-11"
        >
          <Copy className="w-4 h-4 mr-2" />
          Duplicate Brief
        </Button>
        <Button
          onClick={() =>
            navigate(`/design-lab/outputs/${pack?.slug || ""}`)
          }
          variant="outline"
          className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-xl h-11"
        >
          Go to content
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          onClick={() => navigate(`/design-lab/execute/${brief.id}`)}
          className="bg-accent hover:bg-accent/90 text-black font-medium rounded-xl h-11"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate content
        </Button>
      </div>
    </div>
  );
}
