import { useContext as useContextData } from "@/hooks/useContexts";
import { useCards } from "@/hooks/useCards";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { CardType } from "@/types/cards";
import { DocumentUpload } from "@/components/design-lab/DocumentUpload";
import {
  useContextDocuments,
  useUploadContextDocument,
  useDeleteDocument,
} from "@/hooks/useDocuments";

interface BrandVoiceContent {
  toneDescription?: string;
  styleGuidelines?: string[];
  dosExamples?: string[];
  dontsExamples?: string[];
  termsToUse?: string[];
  termsToAvoid?: string[];
}

export default function BrandContext() {
  const { data: context, isLoading: contextLoading } = useContextData();
  const { cards, isLoading: cardsLoading } = useCards();

  // Document management
  const { data: documents = [], isLoading: docsLoading } = useContextDocuments(
    context?.id
  );
  const uploadMutation = useUploadContextDocument();
  const deleteMutation = useDeleteDocument();

  const handleUpload = async (file: File) => {
    if (!context?.id) return;
    await uploadMutation.mutateAsync({ contextId: context.id, file });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id, type: "context" });
  };

  if (contextLoading || cardsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  const voiceInfo = (context?.voice_info || {}) as Record<string, unknown>;
  const brandVoiceCards = cards.filter((c) => c.card_type === CardType.BRAND_VOICE);
  const hasData = Object.keys(voiceInfo).length > 0 || brandVoiceCards.length > 0;

  if (!hasData) {
    return (
      <p className="text-neutral-500 text-sm italic py-4">
        No brand data available. Information is populated during onboarding.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-neutral-400 text-sm">
        Tone of voice, style guidelines and brand identity.
      </p>

      {/* Document Upload Section */}
      <DocumentUpload
        documents={documents}
        isLoading={docsLoading}
        onUpload={handleUpload}
        onDelete={handleDelete}
      />

      {Object.keys(voiceInfo).length > 0 && (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎨</span>
              <h3 className="text-sm font-medium text-neutral-200">Brand Voice</h3>
            </div>
            {Object.entries(voiceInfo).map(([key, value]) => (
              <div key={key}>
                <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  {key.replace(/_/g, " ")}
                </h4>
                {typeof value === "string" ? (
                  <p className="text-sm text-neutral-300">{value}</p>
                ) : Array.isArray(value) ? (
                  <ul className="space-y-1">
                    {value.map((item, i) => (
                      <li key={i} className="text-sm text-neutral-300 flex items-start">
                        <span className="text-neutral-600 mr-2">•</span>
                        {String(item)}
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

      {brandVoiceCards.map((card) => {
        const c = card.content as unknown as BrandVoiceContent;
        return (
          <Card
            key={card.id}
            className="bg-surface-elevated border-0 rounded-2xl"
          >
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎨</span>
                <h3 className="text-sm font-medium text-neutral-200">
                  {card.title || "Brand Voice"}
                </h3>
              </div>

              {c.toneDescription && (
                <div>
                  <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                    Tone
                  </h4>
                  <p className="text-sm text-neutral-300">{c.toneDescription}</p>
                </div>
              )}

              {c.styleGuidelines && c.styleGuidelines.length > 0 && (
                <div>
                  <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
                    Guidelines
                  </h4>
                  <ul className="space-y-1">
                    {c.styleGuidelines.map((g, i) => (
                      <li key={i} className="text-sm text-neutral-300 flex items-start">
                        <span className="text-neutral-600 mr-2">•</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(c.dosExamples?.length || c.dontsExamples?.length) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {c.dosExamples && c.dosExamples.length > 0 && (
                    <div className="bg-green-500/5 rounded-xl p-4">
                      <h4 className="text-xs text-green-400 uppercase tracking-wide mb-2">
                        Do's
                      </h4>
                      <ul className="space-y-1">
                        {c.dosExamples.map((d, i) => (
                          <li key={i} className="text-sm text-green-300/80 flex items-start">
                            <span className="mr-2">✓</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {c.dontsExamples && c.dontsExamples.length > 0 && (
                    <div className="bg-red-500/5 rounded-xl p-4">
                      <h4 className="text-xs text-red-400 uppercase tracking-wide mb-2">
                        Don'ts
                      </h4>
                      <ul className="space-y-1">
                        {c.dontsExamples.map((d, i) => (
                          <li key={i} className="text-sm text-red-300/80 flex items-start">
                            <span className="mr-2">✕</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {(c.termsToUse?.length || c.termsToAvoid?.length) && (
                <div className="space-y-3">
                  {c.termsToUse && c.termsToUse.length > 0 && (
                    <div>
                      <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
                        Terms to Use
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {c.termsToUse.map((t, i) => (
                          <span
                            key={i}
                            className="text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {c.termsToAvoid && c.termsToAvoid.length > 0 && (
                    <div>
                      <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
                        Terms to Avoid
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {c.termsToAvoid.map((t, i) => (
                          <span
                            key={i}
                            className="text-xs bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full line-through"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
