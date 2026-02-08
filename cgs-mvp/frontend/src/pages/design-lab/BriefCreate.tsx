import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { useCreateBrief } from "@/hooks/useBriefs";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  Sparkles,
} from "lucide-react";

interface BriefCreateProps {
  packId: string;
}

interface BriefQuestion {
  id: string;
  question: string;
  type: "select" | "multiselect" | "text" | "textarea";
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PackDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  brief_questions: BriefQuestion[];
  [key: string]: unknown;
}

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function BriefCreate({ packId }: BriefCreateProps) {
  const [, navigate] = useLocation();
  const contextId = useAppStore((s) => s.contextId);
  const { toast } = useToast();

  // Load pack details with questions
  const { data: pack, isLoading: packLoading } = useQuery<PackDetail>({
    queryKey: ["pack", packId],
    queryFn: () => apiRequest<PackDetail>(`/api/v1/packs/${packId}`),
    enabled: !!packId,
  });

  const createBrief = useCreateBrief();

  const [step, setStep] = useState<"name" | "questions" | "creating" | "done">(
    "name"
  );
  const [briefName, setBriefName] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [createdBrief, setCreatedBrief] = useState<{
    id: string;
    slug: string;
    name: string;
    compiled_brief?: string;
    answers?: Record<string, unknown>;
  } | null>(null);

  const questions = useMemo(
    () => pack?.brief_questions || [],
    [pack?.brief_questions]
  );
  const currentQuestion = questions[questionIndex];
  const totalQuestions = questions.length;

  // Handle answer for current question
  const setAnswer = (value: unknown) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  // Multiselect toggle
  const toggleMultiselect = (option: string) => {
    const current = (currentAnswer as string[]) || [];
    if (current.includes(option)) {
      setAnswer(current.filter((o) => o !== option));
    } else {
      setAnswer([...current, option]);
    }
  };

  // Navigation
  const canProceedQuestion = () => {
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    if (!currentAnswer) return false;
    if (Array.isArray(currentAnswer) && currentAnswer.length === 0)
      return false;
    if (typeof currentAnswer === "string" && currentAnswer.trim() === "")
      return false;
    return true;
  };

  const handleNext = async () => {
    if (step === "name") {
      if (!briefName.trim()) return;
      if (totalQuestions > 0) {
        setStep("questions");
      } else {
        await handleSubmit();
      }
      return;
    }

    if (step === "questions") {
      if (questionIndex < totalQuestions - 1) {
        setQuestionIndex((prev) => prev + 1);
      } else {
        await handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (step === "questions" && questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
    } else if (step === "questions") {
      setStep("name");
    } else if (step === "name") {
      navigate("/design-lab");
    }
  };

  const handleSubmit = async () => {
    if (!contextId) {
      toast({
        title: "Errore",
        description: "Context non trovato. Completa l'onboarding.",
        variant: "destructive",
      });
      return;
    }

    setStep("creating");
    try {
      const result = await createBrief.mutateAsync({
        context_id: contextId,
        pack_id: packId,
        name: briefName.trim(),
        answers,
      });
      setCreatedBrief(result);
      setStep("done");
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Errore nella creazione";
      toast({
        title: "Errore",
        description: msg,
        variant: "destructive",
      });
      setStep("questions");
    }
  };

  // Progress
  const progress = useMemo(() => {
    if (step === "name") return 0;
    if (step === "creating" || step === "done") return 100;
    return Math.round(((questionIndex + 1) / totalQuestions) * 100);
  }, [step, questionIndex, totalQuestions]);

  // Loading state
  if (packLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Pack non trovato</p>
        <Button
          variant="ghost"
          onClick={() => navigate("/design-lab")}
          className="mt-4 text-accent"
        >
          Torna alla Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-neutral-400 hover:text-neutral-200 hover:bg-surface-elevated rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Indietro
        </Button>
      </div>

      {/* Progress bar */}
      {(step === "questions" || step === "name") && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
            <span>
              {step === "name"
                ? "Nome Brief"
                : `Domanda ${questionIndex + 1} di ${totalQuestions}`}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Pack info badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">{pack.icon}</span>
        <span className="text-sm text-neutral-400">{pack.name}</span>
      </div>

      {/* Animated steps */}
      <AnimatePresence mode="wait">
        {/* Step: Name */}
        {step === "name" && (
          <motion.div key="name" variants={cardVariants} initial="initial" animate="animate" exit="exit">
            <Card className="bg-surface-elevated border-0 rounded-3xl shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-neutral-100 mb-2">
                  Come vuoi chiamare questo Brief?
                </h2>
                <p className="text-sm text-neutral-400 mb-6">
                  Scegli un nome descrittivo (es. "Welcome B2B", "Editoriale
                  settimanale")
                </p>
                <Input
                  value={briefName}
                  onChange={(e) => setBriefName(e.target.value)}
                  placeholder="Nome del brief..."
                  className="bg-surface border-neutral-700 text-neutral-100 h-12 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  autoFocus
                />
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleNext}
                    disabled={!briefName.trim()}
                    className="bg-accent hover:bg-accent/90 text-black font-medium rounded-xl h-11 px-6"
                  >
                    Continua
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step: Questions */}
        {step === "questions" && currentQuestion && (
          <motion.div
            key={`q-${questionIndex}`}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Card className="bg-surface-elevated border-0 rounded-3xl shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold text-neutral-100 mb-2">
                  {currentQuestion.question}
                </h2>
                {!currentQuestion.required && (
                  <p className="text-xs text-neutral-500 mb-4">(Opzionale)</p>
                )}

                <div className="mt-6 space-y-3">
                  {/* Select (radio) */}
                  {currentQuestion.type === "select" &&
                    currentQuestion.options && (
                      <RadioGroup
                        value={(currentAnswer as string) || ""}
                        onValueChange={(v) => setAnswer(v)}
                      >
                        {currentQuestion.options.map((option) => (
                          <label
                            key={option}
                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                              currentAnswer === option
                                ? "border-accent bg-accent/10 text-neutral-100"
                                : "border-neutral-700 hover:border-neutral-500 text-neutral-300"
                            }`}
                          >
                            <RadioGroupItem value={option} />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    )}

                  {/* Multiselect (checkbox) */}
                  {currentQuestion.type === "multiselect" &&
                    currentQuestion.options && (
                      <div className="space-y-2">
                        {currentQuestion.options.map((option) => {
                          const selected = (
                            (currentAnswer as string[]) || []
                          ).includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => toggleMultiselect(option)}
                              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                                selected
                                  ? "border-accent bg-accent/10 text-neutral-100"
                                  : "border-neutral-700 hover:border-neutral-500 text-neutral-300"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                  selected
                                    ? "border-accent bg-accent"
                                    : "border-neutral-600"
                                }`}
                              >
                                {selected && (
                                  <CheckCircle className="w-3 h-3 text-black" />
                                )}
                              </div>
                              <span className="text-sm">{option}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* Text input */}
                  {currentQuestion.type === "text" && (
                    <Input
                      value={(currentAnswer as string) || ""}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder={currentQuestion.placeholder || "Scrivi qui..."}
                      className="bg-surface border-neutral-700 text-neutral-100 h-12 rounded-xl"
                      onKeyDown={(e) =>
                        e.key === "Enter" && canProceedQuestion() && handleNext()
                      }
                      autoFocus
                    />
                  )}

                  {/* Textarea */}
                  {currentQuestion.type === "textarea" && (
                    <Textarea
                      value={(currentAnswer as string) || ""}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder={currentQuestion.placeholder || "Scrivi qui..."}
                      className="bg-surface border-neutral-700 text-neutral-100 rounded-xl min-h-[120px]"
                      autoFocus
                    />
                  )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="text-neutral-400 hover:text-neutral-200 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Indietro
                  </Button>

                  <div className="flex gap-2">
                    {!currentQuestion.required && (
                      <Button
                        variant="ghost"
                        onClick={handleNext}
                        className="text-neutral-500 hover:text-neutral-300 rounded-xl text-sm"
                      >
                        Salta
                      </Button>
                    )}
                    <Button
                      onClick={handleNext}
                      disabled={
                        currentQuestion.required ? !canProceedQuestion() : false
                      }
                      className="bg-accent hover:bg-accent/90 text-black font-medium rounded-xl h-11 px-6"
                    >
                      {questionIndex < totalQuestions - 1 ? (
                        <>
                          Continua
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Crea Brief
                          <Sparkles className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step: Creating */}
        {step === "creating" && (
          <motion.div key="creating" variants={cardVariants} initial="initial" animate="animate" exit="exit">
            <Card className="bg-surface-elevated border-0 rounded-3xl shadow-lg">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-neutral-100 mb-2">
                  Creazione del brief...
                </h2>
                <p className="text-sm text-neutral-400">
                  Stiamo compilando il tuo brief in base alle risposte.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step: Done */}
        {step === "done" && createdBrief && (
          <motion.div key="done" variants={cardVariants} initial="initial" animate="animate" exit="exit">
            <Card className="bg-surface-elevated border-0 rounded-3xl shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h2 className="text-xl font-semibold text-neutral-100 mb-2">
                    Brief creato!
                  </h2>
                  <p className="text-sm text-neutral-400">
                    "{createdBrief.name}" è pronto. Rivedi le sezioni e genera il
                    primo contenuto.
                  </p>
                </div>

                {/* Quick preview of compiled brief */}
                {createdBrief.compiled_brief && (
                  <div className="bg-surface rounded-2xl p-5 mb-6 max-h-60 overflow-y-auto">
                    <h3 className="text-xs text-neutral-500 uppercase tracking-wide mb-3">
                      Brief Compilato
                    </h3>
                    <div className="text-sm text-neutral-300 whitespace-pre-wrap">
                      {createdBrief.compiled_brief}
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() =>
                      navigate(`/design-lab/brief/${createdBrief.slug}`)
                    }
                    variant="outline"
                    className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-700 rounded-xl h-11"
                  >
                    Vedi Brief
                  </Button>
                  <Button
                    onClick={() =>
                      navigate(`/design-lab/execute/${createdBrief.id}`)
                    }
                    className="flex-1 bg-accent hover:bg-accent/90 text-black font-medium rounded-xl h-11"
                  >
                    Genera Contenuto
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
