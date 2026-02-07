/**
 * ============================================================
 * DESIGN LAB — MAPPA ROUTE COMPLETA
 * ============================================================
 * 
 * Tutte le route del Design Lab con la loro gerarchia.
 * Utile per ricreare il routing in un'altra applicazione.
 */

export interface RouteDefinition {
  /** Path della route */
  path: string;
  /** Nome della pagina */
  name: string;
  /** Livello nella gerarchia (0 = root) */
  level: number;
  /** Route padre (null = root) */
  parent: string | null;
  /** Descrizione della pagina */
  description: string;
  /** Parametri dinamici nella route */
  params?: string[];
}

export const ROUTES: RouteDefinition[] = [
  // ─── Root ───
  {
    path: "/design-lab",
    name: "Home",
    level: 0,
    parent: null,
    description: "Dashboard principale con hero, carousel Agent Pack, preview contesto e outputs.",
  },

  // ─── Contesto (Livello 0 → 1) ───
  {
    path: "/design-lab/context",
    name: "Context Hub",
    level: 0,
    parent: "/design-lab",
    description: "Hub del contesto operativo. Lista le 5 aree del contesto.",
  },
  {
    path: "/design-lab/context/fonti-informative",
    name: "Fonti Informative",
    level: 1,
    parent: "/design-lab/context",
    description: "Sito web, fonti dati, documenti aziendali.",
  },
  {
    path: "/design-lab/context/fonti-mercato",
    name: "Fonti di Mercato",
    level: 1,
    parent: "/design-lab/context",
    description: "Trend, competitor, news, database pubblici.",
  },
  {
    path: "/design-lab/context/brand",
    name: "Brand",
    level: 1,
    parent: "/design-lab/context",
    description: "Colori, tono di voce, asset visivi, linee guida.",
  },
  {
    path: "/design-lab/context/operativo",
    name: "Contesto Operativo",
    level: 1,
    parent: "/design-lab/context",
    description: "Prodotto, target, campagne, topic.",
  },
  {
    path: "/design-lab/context/agent-pack",
    name: "Agent Pack (Briefs)",
    level: 1,
    parent: "/design-lab/context",
    description: "Lista Agent Pack con i rispettivi Brief di configurazione.",
  },

  // ─── Brief Detail (shared, accessibile da contesto e outputs) ───
  {
    path: "/design-lab/brief/:briefSlug",
    name: "Brief Detail",
    level: 2,
    parent: "/design-lab/context/agent-pack",
    description: "Dettaglio completo di un Brief: obiettivo, target, tono, topics, linee guida.",
    params: ["briefSlug"],
  },

  // ─── Outputs (Livello 0 → 1 → 2) ───
  {
    path: "/design-lab/outputs",
    name: "Outputs Hub",
    level: 0,
    parent: "/design-lab",
    description: "Hub lavoro consegnato. Lista Agent Pack con contatori brief.",
  },
  {
    path: "/design-lab/outputs/newsletter",
    name: "Newsletter Pack Outputs",
    level: 1,
    parent: "/design-lab/outputs",
    description: "Contenuti newsletter raggruppati per brief. Feedback chat inline.",
  },
  {
    path: "/design-lab/outputs/blog",
    name: "Blog Pack Outputs",
    level: 1,
    parent: "/design-lab/outputs",
    description: "Contenuti blog raggruppati per brief. Feedback chat inline.",
  },

  // ─── Content View (Livello 2 — shared per tutti i pack) ───
  {
    path: "/design-lab/outputs/:packType/:contentId",
    name: "Content View",
    level: 2,
    parent: "/design-lab/outputs/:packType",
    description: "Dettaglio contenuto con preview (60%) e chat inline (40%). Flusso approvazione.",
    params: ["packType", "contentId"],
  },
];
