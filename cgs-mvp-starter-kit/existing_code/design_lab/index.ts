/**
 * Design Lab — Export Entry Point
 * 
 * Importa tutto da qui:
 *   import { AGENT_PACKS, BRIEFS, getBriefsByPack } from "./design-lab-export";
 */

// Types
export type {
  AgentPack,
  AgentPackStatus,
  AgentPackType,
  Brief,
  BriefStatus,
  ContentItem,
  ContentStatus,
  ChatMessage,
  ChatAction,
  ContextArea,
  OutputPackSummary,
  ApprovalPhase,
  ContentReviewState,
} from "./types";

// Data & Helpers
export {
  AGENT_PACKS,
  BRIEFS,
  CONTENTS_BY_BRIEF,
  CONTEXT_AREAS,
  OUTPUT_PACK_SUMMARIES,
  getBriefsByPack,
  getBriefBySlug,
  getBriefById,
  getContentsByBrief,
  getAgentPack,
  getPendingCountByPack,
  packHasNewContent,
} from "./data";
