import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, ArrowLeft, ArrowRight } from "lucide-react";
import { useCards } from "@/hooks/useCards";
import {
  CardType,
  CardTypeLabels,
  CardTypeDescriptions,
  CardTypeIcons,
} from "@/types/cards";

type ViewMode = "grid" | "detail";

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function OnboardingCards() {
  const [, navigate] = useLocation();
  const { cards, isLoading, isError, updateCard } = useCards();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedCardType, setSelectedCardType] = useState<CardType | null>(
    null
  );
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const allTypes = Object.values(CardType);

  // Get the card data for a given type
  const getCardForType = (type: CardType) => {
    return cards.find((c) => c.card_type === type);
  };

  const handleTypeClick = (type: CardType) => {
    setSelectedCardType(type);
    setViewMode("detail");
    setEditingField(null);
  };

  const handleBack = () => {
    setViewMode("grid");
    setSelectedCardType(null);
    setEditingField(null);
  };

  const handleStartEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSaveEdit = (cardType: string, field: string) => {
    const card = cards.find((c) => c.card_type === cardType);
    if (!card) return;

    const updatedContent = { ...card.content, [field]: editValue };
    updateCard.mutate({ cardType, content: updatedContent });
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  // Get summary text for a card type
  const getCardSummary = (content: Record<string, unknown>, type: CardType): string => {
    switch (type) {
      case CardType.PRODUCT:
        return (content?.valueProposition as string) || "";
      case CardType.TARGET:
        return (content?.description as string) || "";
      case CardType.CAMPAIGNS:
        return ((content?.keyMessages as string[]) || [])[0] || "";
      case CardType.TOPIC:
        return (content?.description as string) || "";
      case CardType.BRAND_VOICE:
        return (content?.toneDescription as string) || "";
      case CardType.COMPETITOR:
        return (content?.positioning as string) || "";
      case CardType.PERFORMANCE:
        return (content?.period as string) || "";
      case CardType.FEEDBACK:
        return (content?.summary as string) || "";
      default:
        return "";
    }
  };

  // Navigate between types when in detail view
  const navigateType = (direction: "prev" | "next") => {
    if (!selectedCardType) return;
    const idx = allTypes.indexOf(selectedCardType);
    if (direction === "prev" && idx > 0) {
      setSelectedCardType(allTypes[idx - 1]);
      setEditingField(null);
    } else if (direction === "next" && idx < allTypes.length - 1) {
      setSelectedCardType(allTypes[idx + 1]);
      setEditingField(null);
    }
  };

  // ── Editable field renderer ──
  const renderEditableField = (
    cardType: string,
    field: string,
    value: string,
    label: string,
    multiline: boolean = false
  ) => {
    const isEditing = editingField === field;

    if (isEditing) {
      return (
        <div className="space-y-2">
          <label className="text-xs text-neutral-400 uppercase tracking-wide">
            {label}
          </label>
          {multiline ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-300 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl resize-none"
              rows={4}
              autoFocus
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-neutral-300 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleSaveEdit(cardType, field)}
              className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg text-xs"
              disabled={updateCard.isPending}
            >
              {updateCard.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : null}
              Salva
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}
              className="text-neutral-500 hover:text-neutral-700 rounded-lg text-xs"
            >
              Annulla
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="group cursor-pointer hover:bg-neutral-50 rounded-lg p-2 -m-2 transition-colors"
        onClick={() => handleStartEdit(field, value)}
      >
        <label className="text-xs text-neutral-400 uppercase tracking-wide">
          {label}
        </label>
        <div className="flex items-start gap-2 mt-1">
          <p className="text-neutral-900 flex-1">
            {value || (
              <span className="text-neutral-300 italic">
                Clicca per aggiungere
              </span>
            )}
          </p>
          <Pencil className="w-3.5 h-3.5 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0" />
        </div>
      </div>
    );
  };

  // ── List field renderer ──
  const renderListField = (items: string[], label: string) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-2">
        <label className="text-xs text-neutral-400 uppercase tracking-wide">
          {label}
        </label>
        <ul className="space-y-1">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="text-neutral-700 text-sm flex items-start"
            >
              <span className="text-neutral-300 mr-2">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // ── Type-specific renderers ──
  const renderCardContent = (
    type: CardType,
    content: Record<string, unknown>
  ) => {
    const ct = type;

    switch (ct) {
      case CardType.PRODUCT:
        return (
          <div className="space-y-6">
            {renderEditableField(
              ct,
              "valueProposition",
              (content.valueProposition as string) || "",
              "Value Proposition",
              true
            )}
            {renderListField(
              (content.features as string[]) || [],
              "Features"
            )}
            {renderListField(
              (content.differentiators as string[]) || [],
              "Differenziatori"
            )}
            {renderListField(
              (content.useCases as string[]) || [],
              "Casi d'uso"
            )}
            {(content.performanceMetrics as { metric: string; value: string }[])
              ?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">
                  Metriche
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    content.performanceMetrics as {
                      metric: string;
                      value: string;
                    }[]
                  ).map((m, i) => (
                    <div
                      key={i}
                      className="bg-neutral-50 rounded-xl p-3 text-center"
                    >
                      <p className="text-lg font-semibold text-neutral-900">
                        {m.value}
                      </p>
                      <p className="text-xs text-neutral-500">{m.metric}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case CardType.TARGET:
        return (
          <div className="space-y-6">
            {renderEditableField(
              ct,
              "icpName",
              (content.icpName as string) || "",
              "Nome ICP"
            )}
            {renderEditableField(
              ct,
              "description",
              (content.description as string) || "",
              "Descrizione",
              true
            )}
            {renderListField(
              (content.painPoints as string[]) || [],
              "Pain Points"
            )}
            {renderListField((content.goals as string[]) || [], "Obiettivi")}
            {renderEditableField(
              ct,
              "preferredLanguage",
              (content.preferredLanguage as string) || "",
              "Linguaggio preferito"
            )}
            {renderListField(
              (content.communicationChannels as string[]) || [],
              "Canali"
            )}
          </div>
        );

      case CardType.BRAND_VOICE:
        return (
          <div className="space-y-6">
            {renderEditableField(
              ct,
              "toneDescription",
              (content.toneDescription as string) || "",
              "Descrizione tono",
              true
            )}
            {renderListField(
              (content.styleGuidelines as string[]) || [],
              "Linee guida stilistiche"
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">
                  Do ✓
                </label>
                <div className="space-y-2">
                  {((content.dosExamples as string[]) || []).map((ex, i) => (
                    <div
                      key={i}
                      className="bg-green-50 border border-green-100 rounded-xl p-3"
                    >
                      <p className="text-green-800 text-sm">"{ex}"</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">
                  Don't ✗
                </label>
                <div className="space-y-2">
                  {((content.dontsExamples as string[]) || []).map((ex, i) => (
                    <div
                      key={i}
                      className="bg-red-50 border border-red-100 rounded-xl p-3"
                    >
                      <p className="text-red-800 text-sm">"{ex}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">
                  Termini da usare
                </label>
                <div className="flex flex-wrap gap-2">
                  {((content.termsToUse as string[]) || []).map((t, i) => (
                    <span
                      key={i}
                      className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">
                  Termini da evitare
                </label>
                <div className="flex flex-wrap gap-2">
                  {((content.termsToAvoid as string[]) || []).map((t, i) => (
                    <span
                      key={i}
                      className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full line-through"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case CardType.COMPETITOR:
        return (
          <div className="space-y-6">
            {renderEditableField(
              ct,
              "competitorName",
              (content.competitorName as string) || "",
              "Competitor"
            )}
            {renderEditableField(
              ct,
              "positioning",
              (content.positioning as string) || "",
              "Posizionamento",
              true
            )}
            {renderListField(
              (content.keyMessages as string[]) || [],
              "Messaggi chiave"
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                {renderListField(
                  (content.strengths as string[]) || [],
                  "Punti di forza"
                )}
              </div>
              <div>
                {renderListField(
                  (content.weaknesses as string[]) || [],
                  "Punti deboli"
                )}
              </div>
            </div>
            {renderListField(
              (content.differentiationOpportunities as string[]) || [],
              "Opportunità"
            )}
          </div>
        );

      case CardType.CAMPAIGNS:
        return (
          <div className="space-y-6">
            {renderEditableField(
              ct,
              "objective",
              (content.objective as string) || "",
              "Obiettivo",
              true
            )}
            {renderListField(
              (content.keyMessages as string[]) || [],
              "Messaggi chiave"
            )}
            {renderEditableField(
              ct,
              "tone",
              (content.tone as string) || "",
              "Tono"
            )}
            {renderListField(
              (content.learnings as string[]) || [],
              "Apprendimenti"
            )}
          </div>
        );

      case CardType.TOPIC:
        return (
          <div className="space-y-6">
            {renderEditableField(
              ct,
              "description",
              (content.description as string) || "",
              "Descrizione",
              true
            )}
            {(content.keywords as string[])?.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-neutral-400 uppercase tracking-wide">
                  Keywords
                </label>
                <div className="flex flex-wrap gap-2">
                  {((content.keywords as string[]) || []).map((kw, i) => (
                    <span
                      key={i}
                      className="bg-neutral-100 text-neutral-700 text-sm px-3 py-1 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {renderListField(
              (content.angles as string[]) || [],
              "Angolazioni"
            )}
          </div>
        );

      case CardType.PERFORMANCE:
        return (
          <div className="space-y-6">
            {renderEditableField(
              ct,
              "period",
              (content.period as string) || "",
              "Periodo"
            )}
            {renderListField(
              (content.insights as string[]) || [],
              "Insights"
            )}
          </div>
        );

      case CardType.FEEDBACK:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  (content.priority as string) === "high"
                    ? "bg-red-100 text-red-700"
                    : (content.priority as string) === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                Priorità {(content.priority as string) || "medium"}
              </span>
            </div>
            {renderEditableField(
              ct,
              "summary",
              (content.summary as string) || "",
              "Sommario",
              true
            )}
            {renderEditableField(
              ct,
              "details",
              (content.details as string) || "",
              "Dettagli",
              true
            )}
            {renderListField(
              (content.actionItems as string[]) || [],
              "Azioni"
            )}
          </div>
        );

      default:
        return (
          <pre className="text-xs text-neutral-500 overflow-auto">
            {JSON.stringify(content, null, 2)}
          </pre>
        );
    }
  };

  // ── Loading / Error ──
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neutral-400" />
        <p className="text-neutral-500 text-sm">Caricamento cards...</p>
      </div>
    );
  }

  if (isError || cards.length === 0) {
    return (
      <Card className="bg-white border-neutral-200 shadow-sm rounded-3xl">
        <CardContent className="pt-10 pb-8 px-8 text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            {isError ? "Errore" : "Nessuna card"}
          </h2>
          <p className="text-neutral-500 mb-6">
            {isError
              ? "Impossibile caricare le cards"
              : "Non ci sono cards disponibili"}
          </p>
          <Button
            onClick={() => navigate("/onboarding")}
            className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl"
          >
            Vai all'Onboarding
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      <AnimatePresence mode="wait">
        {viewMode === "grid" && (
          <motion.div
            key="grid"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">
                Le tue Cards
              </h2>
              <p className="text-neutral-500 text-sm">
                Rivedi e personalizza il contesto del tuo brand
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allTypes.map((type) => {
                const card = getCardForType(type);
                const summary = card
                  ? getCardSummary(card.content, type)
                  : "";

                return (
                  <Card
                    key={type}
                    className="bg-white border-0 shadow-sm rounded-2xl cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                    onClick={() => handleTypeClick(type)}
                  >
                    <CardContent className="p-5">
                      <div className="text-2xl mb-3">
                        {CardTypeIcons[type]}
                      </div>
                      <h3 className="text-sm font-semibold text-neutral-900 mb-0.5">
                        {CardTypeLabels[type]}
                      </h3>
                      <p className="text-xs text-neutral-400 mb-3">
                        {CardTypeDescriptions[type]}
                      </p>
                      {summary && (
                        <p className="text-xs text-neutral-600 line-clamp-2">
                          {summary}
                        </p>
                      )}
                      {!card && (
                        <p className="text-xs text-neutral-300 italic">
                          Non disponibile
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                className="h-11 bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl px-8 font-medium"
                onClick={() => navigate("/design-lab")}
              >
                Vai al Design Lab →
              </Button>
            </div>
          </motion.div>
        )}

        {viewMode === "detail" && selectedCardType && (
          <motion.div
            key={`detail-${selectedCardType}`}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Card className="bg-white border-neutral-200 shadow-sm rounded-3xl">
              <CardContent className="pt-8 pb-8 px-8">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handleBack}
                    className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Tutte le cards
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigateType("prev")}
                      disabled={allTypes.indexOf(selectedCardType) === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 disabled:opacity-30 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-neutral-600" />
                    </button>
                    <span className="text-xs text-neutral-400">
                      {allTypes.indexOf(selectedCardType) + 1}/{allTypes.length}
                    </span>
                    <button
                      onClick={() => navigateType("next")}
                      disabled={
                        allTypes.indexOf(selectedCardType) ===
                        allTypes.length - 1
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 disabled:opacity-30 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">
                      {CardTypeIcons[selectedCardType]}
                    </span>
                    <h2 className="text-xl font-semibold text-neutral-900">
                      {CardTypeLabels[selectedCardType]}
                    </h2>
                  </div>
                  <p className="text-neutral-500 text-sm">
                    {CardTypeDescriptions[selectedCardType]}
                  </p>
                </div>

                <div className="border-t border-neutral-100 pt-6">
                  {(() => {
                    const card = getCardForType(selectedCardType);
                    if (!card) {
                      return (
                        <p className="text-neutral-400 text-center py-8">
                          Nessun dato disponibile per questa card.
                        </p>
                      );
                    }
                    return renderCardContent(
                      selectedCardType,
                      card.content
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
