# Frontend Reference - Pattern dai 2 Onboarding Esistenti

Questo documento estrae i pattern UI/UX gia validati dai frontend esistenti.
Il codice completo e in `existing_code/`.

---

## Design System

### Stack Frontend

- **React 18** con TypeScript
- **Vite** come bundler
- **Tailwind CSS** per styling
- **shadcn/ui** per componenti base (Button, Card, Input, Textarea, RadioGroup, Label)
- **Framer Motion** per animazioni (transizioni tra step)
- **wouter** per routing (leggero, alternativa a react-router)
- **TanStack Query v5** per data fetching
- **Lucide React** per icone

### Palette Colori (Neutral-based)

```
Background:     bg-neutral-100 (pagine) / bg-neutral-50 (input)
Cards:          bg-white border-0 shadow-sm rounded-3xl
Testo primario: text-neutral-900
Testo secondario: text-neutral-500
Testo terziario: text-neutral-400
Bottone primario: bg-neutral-900 text-white hover:bg-neutral-800
Bottone ghost:   text-neutral-600 hover:bg-neutral-100
Input:          bg-neutral-50 border-neutral-200 rounded-xl
Selezione:      border-neutral-900 bg-neutral-50 (selected)
                border-neutral-200 hover:border-neutral-300 (unselected)
Success:        bg-green-50 text-green-700
Error:          bg-red-50 text-red-700
Warning:        bg-yellow-50 text-yellow-700
Info:           bg-blue-50 text-blue-700
```

### Componenti Ricorrenti

```
- Card con rounded-3xl (onboarding steps)
- Card con rounded-2xl (lista items)
- Input con h-12 rounded-xl
- Button con h-11 rounded-xl
- Progress bar: h-1.5 bg-neutral-100 con motion fill
- Tag/chip: bg-neutral-100 text-neutral-700 rounded-full px-3 py-1
```

---

## Pattern 1: Wizard Multi-Step (Onboarding)

### Come Funziona

Il wizard usa un singolo componente con `AnimatePresence` che switcha tra step:

```typescript
type WizardStep = 'brand_name' | 'website' | 'email' | 'goal' | 'context' | 'research' | 'quiz' | 'generate' | 'result';

const [currentStep, setCurrentStep] = useState<WizardStep>('brand_name');

// Animazione tra step
const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

<AnimatePresence mode="wait">
  {currentStep === 'brand_name' && <motion.div key="brand_name" variants={cardVariants} ...>}
  {currentStep === 'website' && <motion.div key="website" variants={cardVariants} ...>}
  ...
</AnimatePresence>
```

### Layout Standard di uno Step

```
┌─────────────────────────────┐
│  Logo Fylle (centrato)      │
│                             │
│ ┌─────────────────────────┐ │
│ │ Card rounded-3xl        │ │
│ │                         │ │
│ │ Titolo (text-xl)        │ │
│ │ Sottotitolo (text-sm)   │ │
│ │                         │ │
│ │ [Input/Select/Textarea] │ │
│ │                         │ │
│ │ [Indietro] [Salta?] [→] │ │
│ └─────────────────────────┘ │
│                             │
│   bg-neutral-100            │
└─────────────────────────────┘
```

### Step con Loading (Research/Generate)

```
┌────────────────────────┐
│  ⟳ Spinner animato     │
│  "Analisi in corso"    │
│  "Stiamo analizzando X"│
│                        │
│  [====----] progress   │
│  "Raccolta info..."    │
│                        │
│  ┌── Info trovata ──┐  │
│  │ Company: X       │  │
│  │ Industry: Y      │  │
│  └──────────────────┘  │
└────────────────────────┘
```

### Step Domande (Quiz)

Le domande vengono mostrate una alla volta con navigazione:

```
"Domanda 3 di 8"
"La tua domanda qui?"
(Opzionale)

○ Opzione 1
● Opzione 2 (selected: bg-neutral-900 text-white)
○ Opzione 3

[Indietro] [Salta?] [Continua / Genera]
```

### File Esistenti

- `existing_code/onboarding_v2/pages/onboarding.tsx` - Wizard completo v2 (~850 righe)
- `existing_code/onboarding_v3/pages/onboarding.tsx` - Wizard semplificato v3 (~380 righe)

**Raccomandazione**: Usa v2 come base (piu completo, gestisce session restore).

---

## Pattern 2: Cards Viewer/Editor

### Come Funziona

Navigazione a 3 livelli: Tipologie → Lista per tipo → Dettaglio card

```
ViewMode: 'types' | 'type-list' | 'detail'
```

### Vista Tipologie (Grid)

```
┌────────┐ ┌────────┐ ┌────────┐
│Product │ │Target  │ │Brand   │
│Value.. │ │Desc... │ │Voice.. │
│    [✎] │ │    [✎] │ │    [✎] │
└────────┘ └────────┘ └────────┘
┌────────┐ ┌────────┐ ┌────────┐
│Topic   │ │Compet. │ │Perform.│
│...     │ │...     │ │...     │
│    [✎] │ │    [✎] │ │    [✎] │
└────────┘ └────────┘ └────────┘
```

### Vista Dettaglio Card

Ogni card ha campi editabili inline (click per editare):

```
┌──────────────────────────────┐
│ PRODUCT                      │
│ Card Title                   │
│ ─────────────────────────── │
│                              │
│ VALUE PROPOSITION            │
│ "Il testo della VP..."  [✎] │
│                              │
│ FEATURES                     │
│ • Feature 1                  │
│ • Feature 2                  │
│                              │
│ METRICHE                     │
│ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │ 98%  │ │ 4.8  │ │ 1.2M │ │
│ │ CTR  │ │Rating│ │Users │ │
│ └──────┘ └──────┘ └──────┘ │
│                              │
│ [Indietro]                   │
└──────────────────────────────┘
```

### 8 Tipi di Card

Vedi `existing_code/onboarding_v2/types/cards.ts` per le interfacce TypeScript complete:

| Tipo | Campi Principali |
|------|-----------------|
| **Product** | valueProposition, features[], differentiators[], useCases[], performanceMetrics[] |
| **Target** | icpName, description, painPoints[], goals[], demographics{} |
| **BrandVoice** | toneDescription, styleGuidelines[], dosExamples[], dontsExamples[], termsToUse[], termsToAvoid[] |
| **Competitor** | competitorName, positioning, strengths[], weaknesses[], differentiationOpportunities[] |
| **Topic** | description, keywords[], angles[], relatedContent[], trends[] |
| **Campaigns** | objective, keyMessages[], tone, assets[], results[], learnings[] |
| **Performance** | period, metrics[], topPerformingContent[], insights[] |
| **Feedback** | source, summary, details, actionItems[], priority |

### File Esistenti

- `existing_code/onboarding_v2/pages/cards.tsx` - Viewer/editor completo (~920 righe)
- `existing_code/onboarding_v2/hooks/useCards.ts` - Hook con TanStack Query
- `existing_code/onboarding_v2/types/cards.ts` - Tutti i tipi TypeScript

---

## Pattern 3: Brief Creation Wizard

### Come Funziona

Simile all'onboarding ma con domande specifiche per pack:

1. Carica domande dal pack (`brief_questions`)
2. Mostra domande una alla volta (RadioGroup per select)
3. Genera brief compilato
4. Mostra brief per review/edit
5. Approva → pronto per generare

### Vista Brief Review

```
┌──────────────────────────────────────────┐
│ ✓ Brief Generato                         │
│ "Rivedi il brief prima di approvarlo"    │
│                                          │
│ ┌── Info Banner ──────────────────────┐  │
│ │ ℹ Dopo approvazione riceverai      │  │
│ │   il primo contenuto da valutare   │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌── Brief Content ───────────────────┐  │
│ │ PURPOSE                            │  │
│ │ "Testo purpose..."                 │  │
│ │                                    │  │
│ │ NON-NEGOTIABLES                    │  │
│ │ key: value                         │  │
│ │ key: value                         │  │
│ │                                    │  │
│ │ BRAND VOICE                        │  │
│ │ ...                                │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌── Sticky Bottom Bar ──────────────┐   │
│ │ [✎ Modifica]    [✓ Approva Brief] │   │
│ └───────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### Brief Editor (inline sections)

Ogni sezione del brief e editabile cliccando sull'icona matita:

```
┌── Section Card ──────────────────┐
│ Brand Voice and Tone         [✎] │
│                                  │
│ TONE                             │
│ [textarea: editing mode]         │
│                                  │
│ GUIDELINES                       │
│ [textarea: editing mode]         │
│ [Salva] [Annulla]                │
└──────────────────────────────────┘
```

### File Esistenti

- `existing_code/onboarding_v2/pages/brief.tsx` - Brief wizard + review + editor (~660 righe)
- `existing_code/onboarding_v2/types/brief.ts` - Tipi Brief

---

## Pattern 4: Pack Selection

### Come Funziona

Mostra dettaglio pack con bottone "Genera Nuovo Brief":

```
┌──────────────────────────────────────────┐
│ [🖼 icon] Blog Post Generator            │
│           Genera articoli di blog...     │
│                        [Genera Brief →]  │
├──────────────────────────────────────────┤
│ I tuoi Brief                             │
│                                          │
│ ┌── Brief 1 ────────────────────────┐   │
│ │ Newsletter Lead - 12 Gen 2026  [→]│   │
│ └────────────────────────────────────┘   │
│ ┌── Brief 2 ────────────────────────┐   │
│ │ Newsletter Clienti - 5 Gen 2026[→]│   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### File Esistenti

- `existing_code/onboarding_v3/pages/packs.tsx` - Pack detail + brief list

---

## Pattern 5: Design Lab Home (Dashboard Post-Onboarding)

Questa e la pagina principale dell'applicazione dopo l'onboarding. Vedi `04_DESIGN_LAB.md` per la documentazione completa e `existing_code/design_lab/` per types/data/routes.

### Layout Home

```
┌─────────────────────────────────────────────┐
│ Benvenuto, {nome}.                          │
│ Scegli un Agent Pack e Fylle si occupa...   │
│ (?) Come funziona?                          │
│                                             │
│ I tuoi Agent Pack                           │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │● Attivo │ │ Dispon. │ │In arrivo│        │
│ │Newslett.│ │Blog Pack│ │Social P.│        │
│ │[Apri →] │ │[Attiva] │ │[Notify] │        │
│ └─────────┘ └─────────┘ └─────────┘        │
│ ← carousel →                               │
│                                             │
│ Il tuo contesto operativo                   │
│ ┌──────────────┐ ┌──────────────┐          │
│ │Fonti Inform. │ │Fonti Mercato │          │
│ └──────────────┘ └──────────────┘          │
│ ┌──────────────┐ ┌──────────────┐          │
│ │Brand         │ │Contesto Oper.│          │
│ └──────────────┘ └──────────────┘          │
│ ┌──────────────┐                           │
│ │Agent Pack    │                           │
│ └──────────────┘                           │
└─────────────────────────────────────────────┘
```

### Theme: Dark mode

Il Design Lab usa un tema dark:
- Background: dark (non neutral-100 come l'onboarding)
- Cards: bg scuro con border subtle
- Accent: arancione (per CTA "Apri", "Attiva")
- Badge: verde per "Attivo", neutro per "Disponibile", grigio per "In arrivo"

### Pack Card States

```typescript
// Da existing_code/design_lab/types.ts
type AgentPackStatus = "active" | "available" | "coming_soon";

// CTA per stato:
// active → "Apri →" (bg arancione, va a /design-lab/outputs/{type})
// available → "Attiva →" (bg arancione, avvia creazione Brief)
// coming_soon → "Notify me 🔔" (outline, registra interesse)
```

### Contesto Operativo - 5 Aree

Le 5 aree sono un raggruppamento UI delle entita backend:

```typescript
// Da existing_code/design_lab/data.ts
const CONTEXT_AREAS = [
  { id: "fonti-informative", label: "Fonti Informative", description: "Sito web, fonti dati, documenti" },
  { id: "fonti-mercato", label: "Fonti di Mercato", description: "Trend, competitor, news" },
  { id: "brand", label: "Brand", description: "Colori, tono di voce, asset visivi" },
  { id: "operativo", label: "Contesto Operativo", description: "Prodotto, target, campagne, topic" },
  { id: "agent-pack", label: "Agent Pack", description: "Brief per Newsletter, Blog" },
];
```

### Notifiche (isNew)

Quando un contenuto ha `isNew: true`:
- Pallino rosso pulsante sulla card del Pack nella Home
- Pallino rosso sul Brief nell'Outputs Hub
- Badge "Nuovo" pulsante sul contenuto nella lista
- Bordo laterale primario sulla riga del contenuto

### File Reference

- `existing_code/design_lab/types.ts` - AgentPack, Brief, ContentItem, ContextArea, OutputPackSummary
- `existing_code/design_lab/data.ts` - Mock data + helper functions
- `existing_code/design_lab/routes.ts` - Mappa route completa

---

## Pattern 6: Content View + Chat Inline (Design Lab Output)

Il contenuto si apre con layout split 60/40: preview a sinistra, chat a destra.

### Layout

```
┌───────────────────────────┬──────────────────────────┐
│ PREVIEW (60%)             │ CHAT (40%)               │
│                           │                          │
│ [Markdown/HTML rendered]  │ 🤖 Sistema: Ecco il     │
│                           │    contenuto generato.   │
│                           │                          │
│                           │ 👤 Tu: Rendi piu formale│
│                           │                          │
│                           │ 🤖 Sistema: Fatto!      │
│                           │    [output aggiornato]   │
│                           │    [context aggiornato]  │
│                           │                          │
│                           │ [Suggestion chips]       │
│                           │ [Input...]          [→]  │
│                           │                          │
│                           │ [✓ Approva e invia]      │
└───────────────────────────┴──────────────────────────┘
```

### Approvazione con Animazione

```
Click "Approva" → Phase "sending" (1.8s, rocket icon + progress bar)
                → Phase "sent" (checkmark, "Contenuto approvato", badge piattaforma)
```

### ContentItem Status

```typescript
type ContentStatus = "da_approvare" | "completato" | "adattato";
// da_approvare: appena generato, in attesa di review
// completato: approvato dall'utente
// adattato: rigenerato in base al feedback (via chat)
```

---

## SSE Streaming (per Execute)

Non usare `EventSource` (non supporta headers auth). Usa `fetch` + `ReadableStream`:

```typescript
// lib/api.ts
export async function fetchSSE(
  url: string,
  onEvent: (event: any) => void,
  onError?: (error: Error) => void,
) {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Authorization': `Bearer ${session?.access_token}` },
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          onEvent(JSON.parse(line.slice(6)));
        } catch (e) { /* skip */ }
      }
    }
  }
}
```

---

## Dipendenze Frontend (package.json)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "wouter": "^3.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.300.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```
