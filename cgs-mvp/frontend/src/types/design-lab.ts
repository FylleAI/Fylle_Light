/**
 * Design Lab Types — from existing_code/design_lab/types.ts
 * AgentPack, Brief, ContentItem, ChatMessage, ContextArea, OutputPackSummary
 */

// ── AGENT PACK ──
export type AgentPackStatus = "active" | "available" | "coming_soon";
export type AgentPackType = "newsletter" | "blog" | "social" | "podcast";

export interface AgentPack {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  outcome: string;
  status: AgentPackStatus;
  user_status?: AgentPackStatus; // Computed per-user
  route?: string;
  sort_order: number;
  is_active: boolean;
  content_type_id?: string;
}

// ── BRIEF ──
export type BriefStatus = "configurato" | "da_configurare";

// Mapping: frontend ↔ backend
// "da_configurare" ↔ "draft"
// "configurato"    ↔ "active"

export interface Brief {
  id: string;
  slug: string;
  name: string;
  pack_id: string;
  context_id: string;
  description?: string;
  status: string; // "draft" | "active" | "archived" from backend
  answers?: Record<string, unknown>;
  compiled_brief?: string;
  questions?: unknown[];
  created_at: string;
  updated_at?: string;
}

// ── CONTENT ITEM ──
export type ContentStatus = "da_approvare" | "completato" | "adattato";

export interface ContentItem {
  id: string;
  number: number;
  title: string;
  created_at: string;
  author: string;
  status: ContentStatus;
  is_new?: boolean;
  text_content?: string;
  preview?: string;
  output_type: string;
  mime_type: string;
  brief_id?: string;
  version: number;
  parent_output_id?: string | null;
  metadata?: Record<string, unknown>;
}

// ── CHAT ──
export type ChatAction = "approve" | "request_change";

export interface ChatMessage {
  id: string;
  type: "user" | "system";
  text: string;
  timestamp: string;
  action?: ChatAction;
}

// ── CONTEXT AREA ──
export interface ContextArea {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

// ── OUTPUT PACK SUMMARY (from /outputs/summary) ──
export interface OutputPackSummary {
  pack_id: string;
  pack_name: string;
  pack_slug: string;
  pack_icon: string;
  briefs: {
    id: string;
    name: string;
    count: number;
    hasNew: boolean;
  }[];
}

// ── APPROVAL FLOW ──
export type ApprovalPhase = "idle" | "sending" | "sent";

export interface ContentReviewState {
  selectedContent: ContentItem | null;
  chatMessages: ChatMessage[];
  feedbackText: string;
  approvalPhase: ApprovalPhase;
}

// ── CONTEXT AREAS DATA (constant, matches backend summary endpoint) ──
export const CONTEXT_AREAS: ContextArea[] = [
  {
    id: "fonti-informative",
    label: "Fonti Informative",
    description: "Sito web, fonti dati, documenti aziendali",
    href: "/design-lab/context/fonti-informative",
    icon: "📄",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    id: "fonti-mercato",
    label: "Fonti di Mercato",
    description: "Trend, competitor, news, database pubblici",
    href: "/design-lab/context/fonti-mercato",
    icon: "📈",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    id: "brand",
    label: "Brand",
    description: "Colori, tono di voce, asset visivi, linee guida",
    href: "/design-lab/context/brand",
    icon: "🎨",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-500",
  },
  {
    id: "operativo",
    label: "Contesto Operativo",
    description: "Prodotto, target, campagne, topic e altro",
    href: "/design-lab/context/operativo",
    icon: "⚙️",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    id: "agent-pack",
    label: "Agent Pack",
    description: "Brief per Newsletter, Blog e altro",
    href: "/design-lab/context/agent-pack",
    icon: "🤖",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
  },
];
