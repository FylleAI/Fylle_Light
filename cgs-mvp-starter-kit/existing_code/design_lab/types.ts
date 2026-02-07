/**
 * ============================================================
 * DESIGN LAB — TIPI COMPLETI
 * ============================================================
 * 
 * Questo file contiene tutti i tipi TypeScript che descrivono
 * la struttura dati del Design Lab. Nessuna dipendenza esterna.
 * 
 * Gerarchia:
 *   AgentPack  →  Brief  →  Content
 *       ↑
 *   ContextArea (indipendente, ma collegata ai pack)
 */

// ────────────────────────────────────────────
// 1. AGENT PACK
// ────────────────────────────────────────────

/** Stato di un Agent Pack nella piattaforma */
export type AgentPackStatus = "active" | "available" | "coming_soon";

/** Tipo di contenuto prodotto dal pack */
export type AgentPackType = "newsletter" | "blog" | "social" | "podcast";

/**
 * Un Agent Pack è l'unità di produzione automatizzata.
 * L'utente attiva un pack → Fylle produce contenuti secondo i Brief configurati.
 */
export interface AgentPack {
  /** Identificatore univoco (es. "newsletter", "blog") */
  id: string;
  /** Nome visualizzato (es. "Newsletter Pack") */
  name: string;
  /** Descrizione dell'outcome prodotto */
  outcome: string;
  /** Stato attuale del pack */
  status: AgentPackStatus;
  /** Tipo di contenuto */
  type: AgentPackType;
  /** Route nell'app per il dettaglio (opzionale, solo se attivo/disponibile) */
  route?: string;
  /** Indica se ci sono contenuti nuovi da revisionare */
  hasNewContent?: boolean;
  /** Stile icona */
  iconBg: string;
  iconColor: string;
}

// ────────────────────────────────────────────
// 2. BRIEF
// ────────────────────────────────────────────

/**
 * Stato di configurazione del brief (frontend).
 *
 * Mapping con il backend (DB: briefs.status):
 *   "da_configurare"  ←→  "draft"
 *   "configurato"     ←→  "active"
 *   (non mostrato)    ←→  "archived"
 */
export type BriefStatus = "configurato" | "da_configurare";

/**
 * Un Brief è una sotto-configurazione di un Agent Pack.
 * Definisce obiettivo, target, tono e linee guida per una
 * specifica tipologia di contenuto all'interno del pack.
 * 
 * Esempio: il Newsletter Pack può avere i brief:
 *   - Welcome B2B (onboarding)
 *   - Editoriale (thought leadership)
 *   - Nurturing (lead conversion)
 */
export interface Brief {
  /** Identificatore univoco del brief (es. "welcome_b2b") */
  id: string;
  /** Slug URL-safe per il routing (es. "welcome-b2b") */
  slug: string;
  /** Nome visualizzato */
  name: string;
  /** ID dell'Agent Pack padre */
  packId: string;
  /** Nome dell'Agent Pack padre */
  packName: string;
  /** Tipo di contenuto (newsletter, blog) */
  type: AgentPackType;
  /** Descrizione sintetica del brief */
  description: string;
  /** Stato di configurazione */
  status: BriefStatus;
  /** Stile icona */
  iconBg: string;
  iconColor: string;
  // ─── Sezioni contenuto del brief ───
  /** Obiettivo strategico */
  objective?: string;
  /** Descrizione del target audience */
  targetAudience?: string;
  /** Tono di voce da utilizzare */
  toneOfVoice?: string;
  /** Frequenza di pubblicazione */
  frequency?: string;
  /** Lista di topic/argomenti principali */
  topics?: string[];
  /** Linee guida operative */
  guidelines?: string;
  /** Contenuto completo del brief in formato Markdown */
  fullContent?: string;
}

// ────────────────────────────────────────────
// 3. CONTENUTO (Content Item)
// ────────────────────────────────────────────

/** Stato del workflow di un contenuto */
export type ContentStatus = "da_approvare" | "completato" | "adattato";

/**
 * Un Content Item è un singolo contenuto prodotto dal sistema
 * a partire da un Brief. Rappresenta l'unità minima di output.
 */
export interface ContentItem {
  /** Identificatore univoco */
  id: string;
  /** Numero progressivo all'interno del brief */
  number: number;
  /** Titolo del contenuto */
  title: string;
  /** Data di produzione (formato DD/MM/YYYY) */
  date: string;
  /** Autore/responsabile */
  author: string;
  /** Stato nel workflow di approvazione */
  status: ContentStatus;
  /** Nota se il contenuto è stato adattato dal feedback utente */
  adaptedNote?: string;
  /** Anteprima testuale (Markdown) */
  preview: string;
  /** Anteprima HTML completa (per newsletter con layout) */
  htmlPreview?: string;
  /** Storico messaggi di feedback (chat) */
  chatHistory?: ChatMessage[];
  /** Flag: il contenuto è appena arrivato (notifica) */
  isNew?: boolean;
}

// ────────────────────────────────────────────
// 4. CHAT / FEEDBACK
// ────────────────────────────────────────────

/** Azione associata a un messaggio di feedback */
export type ChatAction = "approve" | "request_change";

/**
 * Un messaggio nella chat di feedback di un contenuto.
 * Sistema stile Notion: l'utente approva o richiede modifiche
 * direttamente dalla vista contenuto.
 */
export interface ChatMessage {
  /** Identificatore univoco */
  id: string;
  /** Mittente: utente o sistema */
  type: "user" | "system";
  /** Testo del messaggio */
  text: string;
  /** Orario (formato HH:MM) */
  timestamp: string;
  /** Azione associata (solo per messaggi utente) */
  action?: ChatAction;
}

// ────────────────────────────────────────────
// 5. CONTESTO (Context Area)
// ────────────────────────────────────────────

/**
 * Un'area del Contesto operativo.
 * Il contesto è la base di conoscenza che guida la generazione
 * dei contenuti. È organizzato in 5 aree + i Brief degli Agent Pack.
 */
export interface ContextArea {
  /** Identificatore univoco */
  id: string;
  /** Nome visualizzato */
  label: string;
  /** Descrizione sintetica */
  description: string;
  /** Route nell'app */
  href: string;
  /** Stile icona */
  iconBg: string;
  iconColor: string;
}

// ────────────────────────────────────────────
// 6. OUTPUT PACK (Vista aggregata)
// ────────────────────────────────────────────

/**
 * Vista aggregata di un Agent Pack lato output.
 * Usata nella home e nell'hub "Lavoro consegnato" per
 * mostrare contatori e stato dei brief.
 */
export interface OutputPackSummary {
  /** ID dell'Agent Pack */
  id: string;
  /** Nome visualizzato */
  name: string;
  /** Route al dettaglio */
  href: string;
  /** Stile icona */
  iconBg: string;
  iconColor: string;
  /** Flag notifica nuovi contenuti */
  hasNew: boolean;
  /** Brief con contatori */
  briefs: {
    id: string;
    name: string;
    count: number;
    latestNumber: number;
  }[];
}

// ────────────────────────────────────────────
// 7. FLUSSO APPROVAZIONE
// ────────────────────────────────────────────

/** Fasi del flusso di approvazione contenuto */
export type ApprovalPhase = "idle" | "sending" | "sent";

/**
 * Descrive lo stato completo della modale di revisione contenuto.
 */
export interface ContentReviewState {
  /** Contenuto selezionato (null = modale chiusa) */
  selectedContent: ContentItem | null;
  /** Messaggi chat della sessione corrente */
  chatMessages: ChatMessage[];
  /** Testo nell'input di feedback */
  feedbackText: string;
  /** Fase dell'approvazione */
  approvalPhase: ApprovalPhase;
}
