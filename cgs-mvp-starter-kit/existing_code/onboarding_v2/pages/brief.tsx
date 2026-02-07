import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, Pencil, Info, ArrowLeft, Save, X } from 'lucide-react';
import { useBrief } from '@/hooks/useBrief';
import type { BriefQuestion, BriefDocument } from '@shared/types/brief';
const fylleLogo = '/assets/fylle-logotipo-green.png';

type BriefStep = 'loading' | 'questions' | 'generating' | 'result' | 'editing' | 'approved';

// Helper per estrarre query params
function getQueryParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function BriefPage() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<BriefStep>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<BriefQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [brief, setBrief] = useState<BriefDocument | null>(null);

  // Editor state
  const [editingBrief, setEditingBrief] = useState<BriefDocument | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const { startBrief, submitBriefAnswers } = useBrief();

  useEffect(() => {
    const sid = getQueryParam('session_id');
    if (!sid) {
      navigate('/cards');
      return;
    }
    setSessionId(sid);
    
    startBrief.mutateAsync(sid)
      .then((response) => {
        setQuestions(response.questions);
        setCurrentStep('questions');
      })
      .catch((error) => {
        console.error('Failed to start brief:', error);
        setCurrentStep('questions');
      });
  }, []);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!sessionId) return;

    const requiredQuestions = questions.filter(q => q.required);
    const hasAllAnswers = requiredQuestions.every(q => answers[q.id]);

    if (!hasAllAnswers) return;

    setCurrentStep('generating');

    try {
      const result = await submitBriefAnswers.mutateAsync({
        sessionId,
        answers,
      });
      
      setBrief(result.brief);
      setCurrentStep('result');
    } catch (error) {
      setCurrentStep('questions');
    }
  };

  const handleApprove = () => {
    setCurrentStep('approved');
  };

  const handleEdit = () => {
    if (brief) {
      setEditingBrief(JSON.parse(JSON.stringify(brief)));
      setCurrentStep('editing');
    }
  };

  const handleSaveEdit = () => {
    if (editingBrief) {
      setBrief(editingBrief);
      setCurrentStep('result');
      setEditingSection(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingBrief(null);
    setCurrentStep('result');
    setEditingSection(null);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const canProceed = currentQuestion ? !!answers[currentQuestion.id] : false;
  const requiredQuestions = questions.filter(q => q.required);
  const hasAllAnswers = requiredQuestions.every(q => answers[q.id]);

  // ─── RENDER HELPERS ─────────────────────────────────────────────────────────
  const renderValue = (value: any): React.ReactNode => {
    if (typeof value === 'string') {
      return <p className="text-neutral-700 mt-1 text-sm">{value}</p>;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return <p className="text-neutral-700 mt-1 text-sm">{String(value)}</p>;
    }
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside mt-1 text-neutral-700 space-y-0.5">
          {value.map((item: any, idx: number) => (
            <li key={idx} className="text-sm">{typeof item === 'string' ? item : JSON.stringify(item)}</li>
          ))}
        </ul>
      );
    }
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="mt-1 pl-4 border-l-2 border-neutral-100 space-y-2">
          {Object.entries(value).map(([k, v]) => (
            <div key={k}>
              <span className="text-xs font-semibold text-neutral-600">
                {k.replace(/_/g, ' ')}
              </span>
              {renderValue(v)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderSectionContent = (data: Record<string, any>) => (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
            {key.replace(/_/g, ' ')}
          </span>
          {renderValue(value)}
        </div>
      ))}
    </div>
  );

  // ─── LOADING ───────────────────────────────────────────────────────────────
  if (currentStep === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neutral-400" />
          <p className="text-neutral-500 text-sm">Caricamento domande...</p>
        </div>
      </div>
    );
  }

  // ─── QUESTIONS ─────────────────────────────────────────────────────────────
  if (currentStep === 'questions') {
    return (
      <div className="min-h-screen py-12 px-6 bg-neutral-100">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <img src={fylleLogo} alt="Fylle" className="h-11 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Crea il tuo Brief Editoriale
            </h1>
            <p className="text-neutral-500">
              Rispondi alle domande per generare un brief personalizzato
            </p>
          </div>

          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <Card className="bg-white border-0 shadow-sm rounded-3xl">
                  <CardContent className="pt-8 pb-8 px-8">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-neutral-400">
                          Domanda {currentQuestionIndex + 1} di {questions.length}
                        </span>
                        <span className="text-xs text-neutral-400 uppercase">
                          {currentQuestion.section}
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                        {currentQuestion.question}
                      </h2>
                      {currentQuestion.reason && (
                        <p className="text-sm text-neutral-500 mt-2">
                          {currentQuestion.reason}
                        </p>
                      )}
                    </div>

                    <RadioGroup
                      value={answers[currentQuestion.id] || ''}
                      onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                      className="space-y-3"
                    >
                      {currentQuestion.options.map((option, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <RadioGroupItem value={option} id={`option-${idx}`} />
                          <Label
                            htmlFor={`option-${idx}`}
                            className="flex-1 cursor-pointer text-neutral-700 hover:text-neutral-900"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    <div className="flex justify-between mt-8">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className="rounded-xl"
                      >
                        Indietro
                      </Button>
                      
                      {currentQuestionIndex === questions.length - 1 ? (
                        <Button
                          onClick={handleSubmit}
                          disabled={!hasAllAnswers || submitBriefAnswers.isPending}
                          className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl"
                        >
                          {submitBriefAnswers.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generazione...
                            </>
                          ) : (
                            'Genera Brief'
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNext}
                          disabled={!canProceed}
                          className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl"
                        >
                          Avanti
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ─── GENERATING ────────────────────────────────────────────────────────────
  if (currentStep === 'generating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neutral-400" />
          <p className="text-neutral-500 text-sm">Generazione brief in corso...</p>
        </div>
      </div>
    );
  }

  // ─── APPROVED ──────────────────────────────────────────────────────────────
  if (currentStep === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-lg px-6"
        >
          <Card className="bg-white border-0 shadow-sm rounded-3xl">
            <CardContent className="pt-12 pb-10 px-8">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                  className="mb-6"
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                </motion.div>
                
                <h1 className="text-2xl font-bold text-neutral-900 mb-3">
                  Brief Approvato!
                </h1>
                <p className="text-neutral-600 text-base leading-relaxed mb-8">
                  A breve riceverai il primo contenuto da valutare. 
                  Ti invieremo una notifica non appena sarà pronto.
                </p>

                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 mb-8">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-neutral-700 mb-1">Prossimi passi</p>
                      <p className="text-sm text-neutral-500">
                        Il nostro sistema sta preparando un contenuto basato sul tuo brief. 
                        Riceverai una email con il contenuto da revisionare e approvare.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate(sessionId ? `/cards?session_id=${sessionId}` : '/cards')}
                  className="rounded-xl px-8"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Torna alle Cards
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ─── BRIEF EDITOR ──────────────────────────────────────────────────────────
  if (currentStep === 'editing' && editingBrief) {
    const sections = [
      { key: 'purpose', title: 'Purpose', type: 'text' as const },
      { key: 'non_negotiables', title: 'Non-negotiables', type: 'object' as const },
      { key: 'brand_voice', title: 'Brand Voice and Tone', type: 'object' as const },
      { key: 'glossary', title: 'Glossary', type: 'object' as const },
      { key: 'editorial_structure', title: 'Editorial Structure', type: 'object' as const },
      { key: 'citation_rules', title: 'Citation Rules', type: 'object' as const },
    ];

    const updateSectionValue = (sectionKey: string, fieldKey: string, value: string) => {
      setEditingBrief(prev => {
        if (!prev) return prev;
        const section = (prev as any)[sectionKey];
        if (typeof section === 'string') {
          return { ...prev, [sectionKey]: value };
        }
        return {
          ...prev,
          [sectionKey]: { ...section, [fieldKey]: value },
        };
      });
    };

    const updatePurpose = (value: string) => {
      setEditingBrief(prev => prev ? { ...prev, purpose: value } : prev);
    };

    return (
      <div className="min-h-screen py-12 px-6 bg-neutral-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <img src={fylleLogo} alt="Fylle" className="h-11 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Modifica Brief
            </h1>
            <p className="text-neutral-500">
              Clicca su una sezione per modificarla
            </p>
          </div>

          <div className="space-y-4">
            {sections.map((section) => {
              const sectionData = (editingBrief as any)[section.key];
              const isEditing = editingSection === section.key;

              return (
                <Card key={section.key} className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="pt-6 pb-6 px-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-neutral-900">{section.title}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingSection(isEditing ? null : section.key)}
                        className="text-neutral-500 hover:text-neutral-900 rounded-lg"
                      >
                        {isEditing ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Pencil className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {section.type === 'text' ? (
                      isEditing ? (
                        <Textarea
                          value={typeof sectionData === 'string' ? sectionData : ''}
                          onChange={(e) => updatePurpose(e.target.value)}
                          rows={4}
                          className="bg-neutral-50 border-neutral-200 text-neutral-900 rounded-xl resize-none focus:border-neutral-300 focus-visible:ring-0"
                        />
                      ) : (
                        <p className="text-neutral-700 whitespace-pre-wrap">{sectionData}</p>
                      )
                    ) : (
                      <div className="space-y-3">
                        {typeof sectionData === 'object' && sectionData !== null && Object.entries(sectionData).map(([key, value]) => (
                          <div key={key}>
                            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide block mb-1">
                              {key.replace(/_/g, ' ')}
                            </label>
                            {isEditing ? (
                              typeof value === 'string' ? (
                                <Textarea
                                  value={value}
                                  onChange={(e) => updateSectionValue(section.key, key, e.target.value)}
                                  rows={2}
                                  className="bg-neutral-50 border-neutral-200 text-neutral-900 rounded-xl resize-none text-sm focus:border-neutral-300 focus-visible:ring-0"
                                />
                              ) : Array.isArray(value) ? (
                                <Textarea
                                  value={(value as string[]).join('\n')}
                                  onChange={(e) => updateSectionValue(section.key, key, e.target.value)}
                                  rows={Math.min(value.length + 1, 6)}
                                  className="bg-neutral-50 border-neutral-200 text-neutral-900 rounded-xl resize-none text-sm focus:border-neutral-300 focus-visible:ring-0"
                                  placeholder="Un elemento per riga"
                                />
                              ) : (
                                <Textarea
                                  value={JSON.stringify(value, null, 2)}
                                  onChange={(e) => {
                                    try {
                                      const parsed = JSON.parse(e.target.value);
                                      updateSectionValue(section.key, key, parsed);
                                    } catch {
                                      // Keep raw string for now
                                    }
                                  }}
                                  rows={4}
                                  className="bg-neutral-50 border-neutral-200 text-neutral-900 rounded-xl resize-none text-sm font-mono focus:border-neutral-300 focus-visible:ring-0"
                                />
                              )
                            ) : (
                              renderValue(value)
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Fixed bottom bar */}
          <div className="sticky bottom-6 mt-8">
            <Card className="bg-white border-0 shadow-lg rounded-2xl">
              <CardContent className="py-4 px-6">
                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="text-neutral-600 hover:text-neutral-900 rounded-xl"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annulla
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl px-8"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salva Modifiche
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULT (Brief Review) ─────────────────────────────────────────────────
  if (currentStep === 'result' && brief) {
    return (
      <div className="min-h-screen py-12 px-6 bg-neutral-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <img src={fylleLogo} alt="Fylle" className="h-11 mx-auto mb-4" />
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <h1 className="text-2xl font-bold text-neutral-900">
                Brief Generato
              </h1>
            </div>
            <p className="text-neutral-500">
              Rivedi il tuo brief editoriale prima di approvarlo
            </p>
          </div>

          {/* Banner in sovraimpressione */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    Dopo l'approvazione riceverai un primo contenuto da valutare
                  </p>
                  <p className="text-sm text-blue-600">
                    Rivedi attentamente il brief. Se necessario, puoi modificarlo prima di approvare.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Brief Content */}
          <Card className="bg-white border-0 shadow-sm rounded-3xl">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="space-y-8">
                {/* Purpose */}
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-100">
                    Purpose
                  </h2>
                  <p className="text-neutral-700 whitespace-pre-wrap">{brief.purpose}</p>
                </div>

                {/* Non-negotiables */}
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-100">
                    Non-negotiables
                  </h2>
                  {renderSectionContent(brief.non_negotiables)}
                </div>

                {/* Brand Voice */}
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-100">
                    Brand Voice and Tone
                  </h2>
                  {renderSectionContent(brief.brand_voice)}
                </div>

                {/* Glossary */}
                {Object.keys(brief.glossary).length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-100">
                      Glossary
                    </h2>
                    <dl className="space-y-2">
                      {Object.entries(brief.glossary).map(([term, definition]) => (
                        <div key={term} className="flex gap-2">
                          <dt className="font-medium text-neutral-900 shrink-0">{term}:</dt>
                          <dd className="text-neutral-700">{definition}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Editorial Structure */}
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-100">
                    Editorial Structure
                  </h2>
                  {renderSectionContent(brief.editorial_structure)}
                </div>

                {/* Citation Rules */}
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-100">
                    Citation Rules
                  </h2>
                  {renderSectionContent(brief.citation_rules)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sticky action bar */}
          <div className="sticky bottom-6 mt-8">
            <Card className="bg-white border-0 shadow-lg rounded-2xl">
              <CardContent className="py-4 px-6">
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="rounded-xl px-6 border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Modifica
                  </Button>
                  <Button
                    onClick={handleApprove}
                    className="bg-green-600 text-white hover:bg-green-700 rounded-xl px-8 font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approva Brief
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
