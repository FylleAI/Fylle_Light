import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAppStore } from "@/lib/store";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { QuestionResponse } from "@/types/onboarding";

type WizardStep =
  | "brand_name"
  | "website"
  | "email"
  | "research"
  | "quiz"
  | "generate"
  | "result";

const ALL_STEPS: WizardStep[] = [
  "brand_name",
  "website",
  "email",
  "research",
  "quiz",
  "generate",
  "result",
];

const FORM_STEPS: WizardStep[] = ["brand_name", "website", "email"];

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function Onboarding() {
  const [, navigate] = useLocation();
  const user = useAppStore((s) => s.user);
  const setContextId = useAppStore((s) => s.setContextId);

  const [currentStep, setCurrentStep] = useState<WizardStep>("brand_name");
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState(user?.email || "");

  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [researchProgress, setResearchProgress] = useState(0);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [researchSummary, setResearchSummary] = useState("");
  const [cardsCount, setCardsCount] = useState(0);

  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const { toast } = useToast();

  const {
    sessionId,
    startOnboarding,
    submitAnswers,
  } = useOnboarding();

  // Pre-fill email from auth
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user?.email, email]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const currentIndex = ALL_STEPS.indexOf(currentStep);

  const handleNext = () => {
    const stepIndex = ALL_STEPS.indexOf(currentStep);
    if (stepIndex < FORM_STEPS.length - 1) {
      setCurrentStep(ALL_STEPS[stepIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepIndex = ALL_STEPS.indexOf(currentStep);
    if (stepIndex > 0 && FORM_STEPS.includes(ALL_STEPS[stepIndex - 1])) {
      setCurrentStep(ALL_STEPS[stepIndex - 1]);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "brand_name":
        return brandName.trim().length >= 2;
      case "website":
        return true; // optional
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      default:
        return false;
    }
  };

  // ── Start Onboarding (Research + Questions) ──
  const handleStartOnboarding = async () => {
    setCurrentStep("research");
    setResearchProgress(5);

    // Animate fake progress while API is working
    progressInterval.current = setInterval(() => {
      setResearchProgress((prev) => {
        if (prev >= 85) return prev;
        return prev + Math.random() * 8;
      });
    }, 500);

    try {
      const result = await startOnboarding.mutateAsync({
        brand_name: brandName,
        website: website || undefined,
        email,
      });

      // Clear fake progress
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      setResearchProgress(100);
      setResearchSummary(result.research_summary || "");
      setQuestions(result.questions || []);

      // Transition to quiz after a brief moment
      setTimeout(() => {
        setCurrentStep("quiz");
        setCurrentQuestionIndex(0);
      }, 600);
    } catch (err) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      setResearchProgress(0);
      setCurrentStep("email");
      toast({
        title: "Analysis error",
        description:
          err instanceof Error
            ? err.message
            : "Unable to contact the server. Please verify the backend is running.",
        variant: "destructive",
      });
    }
  };

  // ── Submit Answers (Generate Context + Cards) ──
  const handleSubmitAnswers = async () => {
    if (!sessionId) return;

    setCurrentStep("generate");
    setGenerateProgress(5);

    // Animate fake progress
    progressInterval.current = setInterval(() => {
      setGenerateProgress((prev) => {
        if (prev >= 85) return prev;
        return prev + Math.random() * 6;
      });
    }, 600);

    try {
      const result = await submitAnswers.mutateAsync({
        sessionId,
        answers,
      });

      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      setGenerateProgress(100);
      setCardsCount(result.cards_count || 0);

      // Set context in store
      if (result.context_id) {
        setContextId(result.context_id);
      }

      setTimeout(() => {
        setCurrentStep("result");
      }, 600);
    } catch (err) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      setGenerateProgress(0);
      setCurrentStep("quiz");
      setCurrentQuestionIndex(0);
      toast({
        title: "Generation error",
        description:
          err instanceof Error
            ? err.message
            : "Unable to generate the context. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewCards = () => {
    navigate("/onboarding/cards");
  };

  // ── Render helpers ──

  const renderStepCard = (
    title: string,
    subtitle: string,
    content: React.ReactNode,
    showBack: boolean = true,
    showNext: boolean = true,
    nextLabel: string = "Continue",
    onNext?: () => void,
    isOptional: boolean = false,
    nextDisabled: boolean = false
  ) => (
    <motion.div
      key={currentStep}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card className="bg-white border-neutral-200 shadow-sm rounded-3xl">
        <CardContent className="pt-10 pb-8 px-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">
              {title}
            </h2>
            <p className="text-neutral-500 text-sm">{subtitle}</p>
          </div>

          <div className="mb-8">{content}</div>

          <div className="flex gap-3">
            {showBack && currentIndex > 0 && (
              <Button
                variant="ghost"
                className="flex-1 h-11 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 rounded-xl"
                onClick={handleBack}
              >
                Back
              </Button>
            )}
            {isOptional && (
              <Button
                variant="ghost"
                className="flex-1 h-11 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-xl"
                onClick={onNext || handleNext}
              >
                Skip
              </Button>
            )}
            {showNext && (
              <Button
                className="flex-1 h-11 bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl font-medium"
                onClick={onNext || handleNext}
                disabled={nextDisabled || !canProceed()}
              >
                {nextLabel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // ── Step: Brand Name ──
  const renderBrandName = () =>
    renderStepCard(
      "What is your company name?",
      "Enter your brand name",
      <Input
        value={brandName}
        onChange={(e) => setBrandName(e.target.value)}
        placeholder="E.g. Fylle AI"
        className="h-12 text-base bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
        autoFocus
      />,
      false // no back button
    );

  // ── Step: Website ──
  const renderWebsite = () =>
    renderStepCard(
      "What is the website?",
      "Optional — helps us better understand your brand",
      <Input
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="https://example.com"
        type="url"
        className="h-12 text-base bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
        autoFocus
      />,
      true,
      true,
      "Continue",
      undefined,
      true // optional
    );

  // ── Step: Email ──
  const renderEmail = () =>
    renderStepCard(
      "What is your email?",
      "We'll use it for your profile",
      <div className="space-y-2">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourname@company.com"
          type="email"
          className="h-12 text-base bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
          autoFocus
        />
        {email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
          <p className="text-sm text-amber-600">
            Please enter a valid email address
          </p>
        )}
      </div>,
      true,
      true,
      "Start Analysis",
      handleStartOnboarding,
      false,
      startOnboarding.isPending
    );

  // ── Step: Research (Loading) ──
  const renderResearch = () => (
    <motion.div
      key="research"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card className="bg-white border-neutral-200 shadow-sm rounded-3xl">
        <CardContent className="pt-10 pb-8 px-8">
          <div className="text-center">
            <div className="mb-6">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">
              Analysis in progress
            </h2>
            <p className="text-neutral-500 text-sm mb-8">
              Analyzing {brandName}
            </p>

            <div className="space-y-3">
              <div className="relative h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <motion.div
                  className="absolute h-full rounded-full bg-neutral-900"
                  initial={{ width: 0 }}
                  animate={{ width: `${researchProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-neutral-400">
                {researchProgress < 30 && "Gathering information..."}
                {researchProgress >= 30 &&
                  researchProgress < 60 &&
                  "Analyzing brand..."}
                {researchProgress >= 60 &&
                  researchProgress < 90 &&
                  "Synthesizing data..."}
                {researchProgress >= 90 && "Preparing questions..."}
              </p>
            </div>

            {researchSummary && (
              <div className="text-left bg-neutral-50 rounded-xl p-4 border border-neutral-100 mt-6">
                <p className="text-xs text-neutral-400 mb-1">Found:</p>
                <p className="text-neutral-700 text-sm line-clamp-3">
                  {researchSummary}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // ── Step: Quiz ──
  const renderQuiz = () => {
    if (questions.length === 0) return null;

    const question = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const hasAnswer = !!answers[question.id];
    const canContinue = !question.required || hasAnswer;

    const handleQuestionNext = () => {
      if (isLastQuestion) {
        handleSubmitAnswers();
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    };

    const handleQuestionBack = () => {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex((prev) => prev - 1);
      }
    };

    return (
      <motion.div
        key={`quiz-${currentQuestionIndex}`}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Card className="bg-white border-neutral-200 shadow-sm rounded-3xl">
          <CardContent className="pt-10 pb-8 px-8">
            <div className="mb-8">
              <p className="text-neutral-400 text-xs mb-2">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
              <h2 className="text-xl font-semibold text-neutral-900 mb-1">
                {question.question}
              </h2>
              {!question.required && (
                <p className="text-neutral-400 text-sm">Optional</p>
              )}
            </div>

            <div className="mb-8">
              {question.expected_response_type === "select" &&
              question.options ? (
                <RadioGroup
                  value={answers[question.id] || ""}
                  onValueChange={(value) =>
                    setAnswers((prev) => ({ ...prev, [question.id]: value }))
                  }
                  className="grid gap-2"
                >
                  {question.options.map((option) => (
                    <div
                      key={option}
                      className={`flex items-center space-x-3 border rounded-xl p-3 cursor-pointer transition-all ${
                        answers[question.id] === option
                          ? "border-neutral-900 bg-neutral-50"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: option,
                        }))
                      }
                    >
                      <RadioGroupItem
                        value={option}
                        className="border-neutral-300 text-neutral-900"
                      />
                      <span className="text-neutral-700 text-sm">
                        {option}
                      </span>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Input
                  value={answers[question.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: e.target.value,
                    }))
                  }
                  placeholder="Your answer..."
                  className="h-12 text-base bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
                  autoFocus
                />
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 h-11 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 rounded-xl"
                onClick={handleQuestionBack}
                disabled={currentQuestionIndex === 0}
              >
                Back
              </Button>

              {!question.required && !hasAnswer && (
                <Button
                  variant="ghost"
                  className="flex-1 h-11 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-xl"
                  onClick={handleQuestionNext}
                >
                  Skip
                </Button>
              )}

              <Button
                className="flex-1 h-11 bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl font-medium"
                onClick={handleQuestionNext}
                disabled={
                  !canContinue ||
                  (isLastQuestion && submitAnswers.isPending)
                }
              >
                {submitAnswers.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : isLastQuestion ? (
                  "Generate"
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // ── Step: Generate (Loading) ──
  const renderGenerate = () => (
    <motion.div
      key="generate"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card className="bg-white border-neutral-200 shadow-sm rounded-3xl">
        <CardContent className="pt-10 pb-8 px-8">
          <div className="text-center">
            <div className="mb-6">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-neutral-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">
              Generation in progress
            </h2>
            <p className="text-neutral-500 text-sm mb-8">
              Creating your context and cards
            </p>

            <div className="space-y-3">
              <div className="relative h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <motion.div
                  className="absolute h-full rounded-full bg-neutral-900"
                  initial={{ width: 0 }}
                  animate={{ width: `${generateProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-neutral-400">
                {generateProgress < 30 && "Processing answers..."}
                {generateProgress >= 30 &&
                  generateProgress < 60 &&
                  "Generating context..."}
                {generateProgress >= 60 &&
                  generateProgress < 90 &&
                  "Creating cards..."}
                {generateProgress >= 90 && "Finalizing..."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // ── Step: Result ──
  const renderResult = () => (
    <motion.div
      key="result"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card className="bg-white border-neutral-200 shadow-sm rounded-3xl">
        <CardContent className="pt-10 pb-8 px-8">
          <div className="text-center mb-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">
              Complete!
            </h2>
            <p className="text-neutral-500 text-sm">
              We created {cardsCount || 8} cards for{" "}
              <strong>{brandName}</strong>
            </p>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Company</span>
                <span className="text-neutral-900 font-medium">
                  {brandName}
                </span>
              </div>
              {website && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Website</span>
                  <span className="text-neutral-900">{website}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Cards created</span>
                <span className="text-neutral-900 font-medium">
                  {cardsCount || 8}
                </span>
              </div>
            </div>
          </div>

          <Button
            className="w-full h-11 bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl font-medium"
            onClick={handleViewCards}
          >
            Review your Cards →
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-6">
        {ALL_STEPS.map((step, idx) => (
          <div
            key={step}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx <= currentIndex
                ? "bg-neutral-900 w-6"
                : "bg-neutral-300 w-1.5"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {currentStep === "brand_name" && renderBrandName()}
        {currentStep === "website" && renderWebsite()}
        {currentStep === "email" && renderEmail()}
        {currentStep === "research" && renderResearch()}
        {currentStep === "quiz" && renderQuiz()}
        {currentStep === "generate" && renderGenerate()}
        {currentStep === "result" && renderResult()}
      </AnimatePresence>

      {/* Quick access for existing users */}
      {FORM_STEPS.includes(currentStep) && (
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              try {
                const contexts = await apiRequest<{ id: string }[]>("/api/v1/contexts");
                if (contexts.length > 0) {
                  setContextId(contexts[0].id);
                  navigate("/design-lab");
                } else {
                  toast({ title: "No context found", description: "Complete onboarding first.", variant: "destructive" });
                }
              } catch {
                toast({ title: "Connection error", description: "Backend may not be running.", variant: "destructive" });
              }
            }}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors underline underline-offset-2"
          >
            Already have a context? Go to Design Lab →
          </button>
        </div>
      )}
    </div>
  );
}
