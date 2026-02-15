import { useState } from "react";
import { useContext as useContextData, useUpdateContext } from "@/hooks/useContexts";
import { useCards } from "@/hooks/useCards";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { CardType } from "@/types/cards";
import { DocumentUpload } from "@/components/design-lab/DocumentUpload";
import {
  useContextDocuments,
  useUploadContextDocument,
  useDeleteDocument,
} from "@/hooks/useDocuments";
import { useToast } from "@/hooks/use-toast";

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
  const updateContext = useUpdateContext();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({});

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

  const startEditing = () => {
    setEditData({ ...voiceInfo });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditData({});
    setIsEditing(false);
  };

  const handleSave = () => {
    updateContext.mutate(
      { updates: { voice_info: editData } },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({ title: "Brand voice updated" });
        },
        onError: (error) => {
          toast({
            title: "Update failed",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const updateField = (key: string, value: unknown) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  const renderEditField = (key: string, value: unknown) => {
    if (Array.isArray(value)) {
      return (
        <textarea
          value={(value as string[]).join("\n")}
          onChange={(e) =>
            updateField(
              key,
              e.target.value.split("\n").filter((s) => s.trim())
            )
          }
          rows={Math.max(3, (value as string[]).length + 1)}
          placeholder="One item per line..."
          className="w-full bg-surface text-neutral-200 text-sm rounded-xl px-4 py-3 resize-none border border-neutral-700 focus:border-accent/50 focus:outline-none placeholder:text-neutral-600"
        />
      );
    }
    if (typeof value === "string" && value.length > 80) {
      return (
        <textarea
          value={value}
          onChange={(e) => updateField(key, e.target.value)}
          rows={3}
          className="w-full bg-surface text-neutral-200 text-sm rounded-xl px-4 py-3 resize-none border border-neutral-700 focus:border-accent/50 focus:outline-none placeholder:text-neutral-600"
        />
      );
    }
    return (
      <input
        type="text"
        value={typeof value === "string" ? value : JSON.stringify(value)}
        onChange={(e) => updateField(key, e.target.value)}
        className="w-full bg-surface text-neutral-200 text-sm rounded-xl px-4 py-3 border border-neutral-700 focus:border-accent/50 focus:outline-none placeholder:text-neutral-600"
      />
    );
  };

  if (!hasData && !isEditing) {
    return (
      <div className="space-y-4">
        <p className="text-neutral-500 text-sm italic py-4">
          No brand data available. Information is populated during onboarding.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditData({});
            setIsEditing(true);
          }}
          className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg"
        >
          <Pencil className="w-3.5 h-3.5 mr-2" />
          Add Data
        </Button>
      </div>
    );
  }

  const displayVoice = isEditing ? editData : voiceInfo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-neutral-400 text-sm">
          Tone of voice, style guidelines and brand identity.
        </p>
        {!isEditing ? (
          <Button
            size="sm"
            variant="outline"
            onClick={startEditing}
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-lg"
          >
            <Pencil className="w-3.5 h-3.5 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={cancelEditing}
              className="border-neutral-600 text-neutral-400 hover:bg-neutral-700 rounded-lg"
            >
              <X className="w-3.5 h-3.5 mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateContext.isPending}
              className="bg-accent hover:bg-accent/90 text-black font-medium rounded-lg"
            >
              {updateContext.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-2" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Document Upload Section */}
      <DocumentUpload
        documents={documents}
        isLoading={docsLoading}
        onUpload={handleUpload}
        onDelete={handleDelete}
      />

      {/* Voice Info from Context */}
      {Object.keys(displayVoice).length > 0 && (
        <Card className="bg-surface-elevated border-0 rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎨</span>
              <h3 className="text-sm font-medium text-neutral-200">Brand Voice</h3>
            </div>
            {Object.entries(displayVoice).map(([key, value]) => (
              <div key={key}>
                <h4 className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
                  {key.replace(/_/g, " ")}
                </h4>
                {isEditing ? (
                  renderEditField(key, value)
                ) : typeof value === "string" ? (
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

      {/* Brand Voice Cards (from cards table — read only) */}
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
