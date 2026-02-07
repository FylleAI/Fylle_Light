/**
 * ============================================================
 * DESIGN LAB — DATI MOCK COMPLETI
 * ============================================================
 * 
 * Tutti i dati mock utilizzati nel Design Lab, pronti per
 * essere importati in qualsiasi applicazione TypeScript/JavaScript.
 * 
 * Dipende solo da ./types.ts (nessuna dipendenza React o UI).
 */

import type {
  AgentPack,
  Brief,
  ContentItem,
  ContentStatus,
  ContextArea,
  OutputPackSummary,
} from "./types";

// ────────────────────────────────────────────
// 1. AGENT PACKS
// ────────────────────────────────────────────

export const AGENT_PACKS: AgentPack[] = [
  {
    id: "newsletter",
    name: "Newsletter Pack",
    outcome: "Newsletter pronta e pubblicata ogni settimana.",
    status: "active",
    type: "newsletter",
    route: "/design-lab/outputs/newsletter",
    hasNewContent: true,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    id: "blog",
    name: "Blog Pack",
    outcome: "Articoli SEO pubblicati con continuità.",
    status: "available",
    type: "blog",
    route: "/design-lab/outputs/blog",
    hasNewContent: false,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    id: "social",
    name: "Social Pack",
    outcome: "Piano e post multi-canale pubblicati.",
    status: "coming_soon",
    type: "social",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
  },
  {
    id: "podcast",
    name: "Podcast Pack",
    outcome: "Episodi audio prodotti e distribuiti.",
    status: "coming_soon",
    type: "podcast",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-500",
  },
];

// ────────────────────────────────────────────
// 2. BRIEFS
// ────────────────────────────────────────────

export const BRIEFS: Brief[] = [
  // ─── Newsletter Pack ───
  {
    id: "welcome_b2b",
    slug: "welcome-b2b",
    name: "Welcome B2B",
    packId: "newsletter",
    packName: "Newsletter Pack",
    type: "newsletter",
    description: "Newsletter di benvenuto per nuovi clienti B2B. Sequenza automatica di onboarding.",
    status: "configurato",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    objective: "Accogliere i nuovi clienti B2B e guidarli nell'utilizzo della piattaforma con una sequenza di email informative e coinvolgenti.",
    targetAudience: "Nuovi clienti B2B che hanno appena sottoscritto un abbonamento. Decision maker e team operativi.",
    toneOfVoice: "Professionale ma amichevole, orientato al valore. Evitare tecnicismi eccessivi.",
    frequency: "Settimanale per le prime 4 settimane, poi bisettimanale",
    topics: ["Onboarding prodotto", "Best practices", "Case study clienti", "Tips & tricks"],
    guidelines: "Ogni newsletter deve includere una CTA chiara. Lunghezza massima 600 parole. Includere almeno un dato o statistica rilevante.",
    fullContent: `# Brief: Welcome B2B

## Obiettivo
Accogliere i nuovi clienti B2B e guidarli nell'utilizzo della piattaforma con una sequenza di email informative e coinvolgenti.

## Target
Nuovi clienti B2B che hanno appena sottoscritto un abbonamento. Decision maker e team operativi.

## Tono di voce
Professionale ma amichevole, orientato al valore. Evitare tecnicismi eccessivi.

## Frequenza
Settimanale per le prime 4 settimane, poi bisettimanale.

## Topic principali
- Onboarding prodotto
- Best practices
- Case study clienti
- Tips & tricks

## Linee guida
- Ogni newsletter deve includere una CTA chiara
- Lunghezza massima 600 parole
- Includere almeno un dato o statistica rilevante
- Usare immagini e grafici quando possibile`,
  },
  {
    id: "editoriale",
    slug: "editoriale",
    name: "Editoriale",
    packId: "newsletter",
    packName: "Newsletter Pack",
    type: "newsletter",
    description: "Newsletter editoriale settimanale con insights di settore e thought leadership.",
    status: "configurato",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-500",
    objective: "Posizionare il brand come thought leader nel settore attraverso contenuti editoriali di alta qualità con analisi e insights originali.",
    targetAudience: "Professionisti del settore, C-level, marketing manager. Audience già ingaggiata e con interesse per approfondimenti.",
    toneOfVoice: "Autorevole, analitico, con un tocco personale. Stile editoriale da rivista di settore.",
    frequency: "Settimanale, ogni martedì mattina",
    topics: ["Trend di settore", "Analisi dati", "Opinioni esperti", "Casi studio", "Previsioni"],
    guidelines: "Formato long-form (800-1200 parole). Ogni edizione deve avere un tema centrale. Includere dati e fonti verificabili. Chiudere con una riflessione o domanda aperta.",
    fullContent: `# Brief: Editoriale

## Obiettivo
Posizionare il brand come thought leader nel settore attraverso contenuti editoriali di alta qualità.

## Target
Professionisti del settore, C-level, marketing manager. Audience già ingaggiata.

## Tono di voce
Autorevole, analitico, con un tocco personale. Stile editoriale da rivista di settore.

## Frequenza
Settimanale, ogni martedì mattina.

## Topic principali
- Trend di settore
- Analisi dati
- Opinioni esperti
- Casi studio
- Previsioni

## Linee guida
- Formato long-form (800-1200 parole)
- Ogni edizione deve avere un tema centrale
- Includere dati e fonti verificabili
- Chiudere con una riflessione o domanda aperta`,
  },
  {
    id: "nurturing",
    slug: "nurturing",
    name: "Nurturing",
    packId: "newsletter",
    packName: "Newsletter Pack",
    type: "newsletter",
    description: "Sequenza di nurturing per lead qualificati. Focus su conversione e valore.",
    status: "da_configurare",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    objective: "Guidare i lead qualificati verso la conversione attraverso contenuti di valore che risolvono problemi specifici e dimostrano il ROI della soluzione.",
    targetAudience: "Lead qualificati (MQL/SQL) che hanno mostrato interesse ma non ancora convertito. Focus su pain points specifici.",
    toneOfVoice: "Consulenziale, empatico, orientato alla soluzione. Evitare toni troppo commerciali.",
    frequency: "Bisettimanale",
    topics: ["Pain points di settore", "ROI e business case", "Testimonianze", "Demo e tutorial", "Offerte mirate"],
    guidelines: "Massimo 400 parole. Ogni email deve risolvere un problema specifico. CTA diretta verso demo o trial. Personalizzazione per industry quando possibile.",
    fullContent: `# Brief: Nurturing

## Obiettivo
Guidare i lead qualificati verso la conversione attraverso contenuti di valore.

## Target
Lead qualificati (MQL/SQL) che hanno mostrato interesse ma non ancora convertito.

## Tono di voce
Consulenziale, empatico, orientato alla soluzione. Evitare toni troppo commerciali.

## Frequenza
Bisettimanale.

## Topic principali
- Pain points di settore
- ROI e business case
- Testimonianze
- Demo e tutorial
- Offerte mirate

## Linee guida
- Massimo 400 parole
- Ogni email deve risolvere un problema specifico
- CTA diretta verso demo o trial
- Personalizzazione per industry quando possibile`,
  },
  // ─── Blog Pack ───
  {
    id: "editorial_ai",
    slug: "editorial-ai",
    name: "Editorial AI",
    packId: "blog",
    packName: "Blog Pack",
    type: "blog",
    description: "Articoli editoriali su intelligenza artificiale e content marketing.",
    status: "configurato",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    objective: "Produrre articoli SEO-optimized su AI e content marketing per generare traffico organico qualificato.",
    targetAudience: "Marketing manager, content creator, imprenditori interessati all'AI. Livello intermedio di competenza tecnica.",
    toneOfVoice: "Informativo, pratico, con esempi concreti. Accessibile ma non banale.",
    frequency: "2 articoli a settimana",
    topics: ["AI nel marketing", "Content automation", "SEO e AI", "Tool e framework", "Case study"],
    guidelines: "1000-1500 parole. Struttura con H2/H3 ben definita. Includere meta description e keywords target. Almeno 3 link interni.",
    fullContent: `# Brief: Editorial AI

## Obiettivo
Produrre articoli SEO-optimized su AI e content marketing per generare traffico organico qualificato.

## Target
Marketing manager, content creator, imprenditori interessati all'AI.

## Tono di voce
Informativo, pratico, con esempi concreti. Accessibile ma non banale.

## Frequenza
2 articoli a settimana.

## Topic principali
- AI nel marketing
- Content automation
- SEO e AI
- Tool e framework
- Case study

## Linee guida
- 1000-1500 parole
- Struttura con H2/H3 ben definita
- Includere meta description e keywords target
- Almeno 3 link interni`,
  },
];

// ────────────────────────────────────────────
// 3. CONTENUTI PER BRIEF
// ────────────────────────────────────────────

/**
 * Mappa briefId → ContentItem[].
 * Ogni brief ha un array di contenuti prodotti.
 */
export const CONTENTS_BY_BRIEF: Record<string, ContentItem[]> = {
  // ─── Newsletter: Welcome B2B ───
  welcome_b2b: [
    {
      id: "16",
      number: 16,
      title: "Newsletter - Welcome_b2b - 16",
      date: "16/12/2024",
      author: "Denise",
      status: "adattato",
      adaptedNote: "Adattato in base al tuo feedback precedente.",
      preview: "## Benvenuto in Fylle!\n\nCiao Marco,\n\nSiamo entusiasti di averti a bordo! Fylle è il tuo nuovo alleato per automatizzare la creazione di contenuti di qualità.\n\n### Cosa puoi fare con Fylle:\n\n1. **Newsletter automatiche** - Contenuti freschi ogni settimana\n2. **Blog post SEO** - Articoli ottimizzati per i motori di ricerca\n3. **Adattamento continuo** - Il sistema impara dai tuoi feedback\n\n### Prossimi passi:\n\n- Completa il tuo profilo contesto\n- Attiva il primo Agent Pack\n- Lascia che Fylle lavori per te\n\nUn saluto,\nIl team Fylle",
    },
    {
      id: "15",
      number: 15,
      title: "Newsletter - Welcome_b2b - 15",
      date: "15/12/2024",
      author: "Denise",
      status: "completato",
      preview: "## Update settimanale #15\n\nCiao Marco,\n\nEcco gli aggiornamenti di questa settimana...\n\n### Novità:\n- Nuova integrazione con GA4\n- Miglioramenti al sistema di feedback\n\nA presto!",
    },
    {
      id: "14",
      number: 14,
      title: "Newsletter - Welcome_b2b - 14",
      date: "14/12/2024",
      author: "Denise",
      status: "completato",
      preview: "## Update settimanale #14\n\nCiao Marco,\n\nContenuto della newsletter numero 14...",
    },
    {
      id: "13",
      number: 13,
      title: "Newsletter - Welcome_b2b - 13",
      date: "13/12/2024",
      author: "Denise",
      status: "completato",
      preview: "## Update settimanale #13\n\nCiao Marco,\n\nContenuto della newsletter numero 13...",
    },
  ],
  // ─── Newsletter: Editoriale ───
  editoriale: [
    {
      id: "5",
      number: 5,
      title: "Newsletter - Editoriale - 5",
      date: "17/12/2024",
      author: "Milo",
      status: "da_approvare",
      preview: "## Il futuro del Content Marketing è già qui\n\nLa settimana scorsa abbiamo visto come l'AI stia rivoluzionando il modo in cui produciamo contenuti. Ma cosa significa questo per chi lavora nel marketing?\n\n### 3 insight dalla settimana:\n\n1. **Google SGE cambia le regole SEO**\n2. **Il ROI del content automation** - +40% output, -30% costi\n3. **La qualità non si automatizza** - L'AI produce, l'umano cura\n\n---\n\n*Buona lettura, Il team editoriale*",
    },
    {
      id: "4",
      number: 4,
      title: "Newsletter - Editoriale - 4",
      date: "10/12/2024",
      author: "Milo",
      status: "completato",
      preview: "## AI e creatività: nemici o alleati?\n\nUn approfondimento sul rapporto tra intelligenza artificiale e processo creativo nel marketing moderno.\n\n### Highlights:\n- Intervista a un Creative Director\n- I numeri del mercato AI nel 2024\n- 5 tool che stanno cambiando il content marketing\n\n---\n\n*Alla prossima, Il team editoriale*",
    },
    {
      id: "3",
      number: 3,
      title: "Newsletter - Editoriale - 3",
      date: "03/12/2024",
      author: "Milo",
      status: "completato",
      preview: "## Personalizzazione su scala: il sogno diventa realtà\n\nCome le nuove tecnologie AI permettono di creare contenuti personalizzati per migliaia di utenti simultaneamente.\n\n---\n\n*Il team editoriale*",
    },
  ],
  // ─── Newsletter: Nurturing (1 contenuto, nuovo, da approvare) ───
  nurturing: [
    {
      id: "1",
      number: 1,
      title: "GenW - Market Volatility & Rotation Signals",
      date: "04/02/2025",
      author: "Milo",
      status: "da_approvare",
      isNew: true,
      preview: "",
      // htmlPreview: va importato separatamente da ./nurturing-html.ts
    },
  ],
  // ─── Blog: Editorial AI ───
  editorial_ai: [
    {
      id: "8",
      number: 8,
      title: "BlogPost - Editorial_AI - 8",
      date: "16/12/2024",
      author: "Milo",
      status: "da_approvare",
      preview: "# Come l'AI sta rivoluzionando il Content Marketing\n\nL'intelligenza artificiale non è più fantascienza: è qui, ed è pronta a trasformare il modo in cui creiamo contenuti.\n\n## L'evoluzione del content marketing\n\n### I vantaggi dell'AI nel content marketing:\n\n1. **Velocità di produzione**\n2. **Consistenza del brand voice**\n3. **Ottimizzazione SEO automatica**\n4. **Personalizzazione su scala**\n\n## Il futuro è ibrido\n\nLa soluzione migliore? Un approccio ibrido che combina creatività umana con efficienza AI.",
    },
    {
      id: "7",
      number: 7,
      title: "BlogPost - Editorial_AI - 7",
      date: "15/12/2024",
      author: "Milo",
      status: "completato",
      preview: "# 5 Trend AI da seguire nel 2025\n\nL'intelligenza artificiale continua a evolversi a ritmi impressionanti. Ecco i 5 trend che domineranno il 2025.",
    },
    {
      id: "6",
      number: 6,
      title: "BlogPost - Editorial_AI - 6",
      date: "08/12/2024",
      author: "Milo",
      status: "completato",
      preview: "# SEO e AI: la guida definitiva\n\nCome l'AI sta cambiando le regole della SEO e cosa devi sapere per restare competitivo.",
    },
  ],
};

// ────────────────────────────────────────────
// 4. AREE CONTESTO
// ────────────────────────────────────────────

export const CONTEXT_AREAS: ContextArea[] = [
  {
    id: "fonti-informative",
    label: "Fonti Informative",
    description: "Sito web, fonti dati, documenti aziendali",
    href: "/design-lab/context/fonti-informative",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    id: "fonti-mercato",
    label: "Fonti di Mercato",
    description: "Trend, competitor, news, database pubblici",
    href: "/design-lab/context/fonti-mercato",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    id: "brand",
    label: "Brand",
    description: "Colori, tono di voce, asset visivi, linee guida",
    href: "/design-lab/context/brand",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-500",
  },
  {
    id: "operativo",
    label: "Contesto Operativo",
    description: "Prodotto, target, campagne, topic e altro",
    href: "/design-lab/context/operativo",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    id: "agent-pack",
    label: "Agent Pack",
    description: "Brief per Newsletter, BlogPost",
    href: "/design-lab/context/agent-pack",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
  },
];

// ────────────────────────────────────────────
// 5. OUTPUT PACK SUMMARIES (per home/hub)
// ────────────────────────────────────────────

export const OUTPUT_PACK_SUMMARIES: OutputPackSummary[] = [
  {
    id: "newsletter",
    name: "Newsletter Pack",
    href: "/design-lab/outputs/newsletter",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    hasNew: true,
    briefs: [
      { id: "welcome_b2b", name: "Welcome B2B", count: 4, latestNumber: 16 },
      { id: "editoriale", name: "Editoriale", count: 3, latestNumber: 5 },
      { id: "nurturing", name: "Nurturing", count: 1, latestNumber: 1 },
    ],
  },
  {
    id: "blog",
    name: "Blog Pack",
    href: "/design-lab/outputs/blog",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    hasNew: false,
    briefs: [
      { id: "editorial_ai", name: "Editorial AI", count: 3, latestNumber: 8 },
    ],
  },
];

// ────────────────────────────────────────────
// 6. HELPER FUNCTIONS
// ────────────────────────────────────────────

/** Restituisce tutti i brief di un Agent Pack */
export function getBriefsByPack(packId: string): Brief[] {
  return BRIEFS.filter((b) => b.packId === packId);
}

/** Restituisce un singolo brief dato lo slug */
export function getBriefBySlug(slug: string): Brief | undefined {
  return BRIEFS.find((b) => b.slug === slug);
}

/** Restituisce un singolo brief dato l'id */
export function getBriefById(id: string): Brief | undefined {
  return BRIEFS.find((b) => b.id === id);
}

/** Restituisce i contenuti di un brief */
export function getContentsByBrief(briefId: string): ContentItem[] {
  return CONTENTS_BY_BRIEF[briefId] || [];
}

/** Restituisce un Agent Pack dato l'id */
export function getAgentPack(id: string): AgentPack | undefined {
  return AGENT_PACKS.find((p) => p.id === id);
}

/** Conta i contenuti "da approvare" per un pack */
export function getPendingCountByPack(packId: string): number {
  const briefs = getBriefsByPack(packId);
  return briefs.reduce((total, brief) => {
    const contents = getContentsByBrief(brief.id);
    return total + contents.filter((c) => c.status === "da_approvare").length;
  }, 0);
}

/** Verifica se un pack ha contenuti nuovi (isNew) */
export function packHasNewContent(packId: string): boolean {
  const briefs = getBriefsByPack(packId);
  return briefs.some((brief) => {
    const contents = getContentsByBrief(brief.id);
    return contents.some((c) => c.isNew);
  });
}
