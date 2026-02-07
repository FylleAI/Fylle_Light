/**
 * Brief Types - Mapped from Python backend models
 * 
 * These types match the FastAPI backend brief models
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum BriefSection {
  BRAND_VOICE = "brand_voice",
  EDITORIAL_STRUCTURE = "editorial_structure",
  CITATIONS = "citations",
  NON_NEGOTIABLES = "non_negotiables",
}

// ============================================================================
// DOMAIN MODELS
// ============================================================================

export interface BriefQuestion {
  id: string;
  question: string;
  options: string[]; // Always multiple choice
  required: boolean;
  section: BriefSection;
  reason?: string;
}

export interface BriefDocument {
  purpose: string;
  non_negotiables: Record<string, any>;
  brand_voice: Record<string, any>;
  glossary: Record<string, string>; // term -> definition
  editorial_structure: Record<string, any>;
  citation_rules: Record<string, any>;
}

// ============================================================================
// API REQUEST MODELS
// ============================================================================

export interface StartBriefRequest {
  // No body needed, uses session_id from path
}

export interface SubmitBriefAnswersRequest {
  answers: Record<string, any>; // question_id -> answer
}

// ============================================================================
// API RESPONSE MODELS
// ============================================================================

export interface StartBriefResponse {
  brief_session_id: string;
  questions: BriefQuestion[];
  message: string;
}

export interface SubmitBriefAnswersResponse {
  brief: BriefDocument;
  message: string;
}
