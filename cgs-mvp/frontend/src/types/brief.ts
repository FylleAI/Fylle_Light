/**
 * Brief Types — from existing_code/onboarding_v2/types/brief.ts
 */

export enum BriefSection {
  BRAND_VOICE = "brand_voice",
  EDITORIAL_STRUCTURE = "editorial_structure",
  CITATIONS = "citations",
  NON_NEGOTIABLES = "non_negotiables",
}

export interface BriefQuestion {
  id: string;
  question: string;
  options: string[];
  required: boolean;
  section: BriefSection;
  reason?: string;
}

export interface BriefDocument {
  purpose: string;
  non_negotiables: Record<string, unknown>;
  brand_voice: Record<string, unknown>;
  glossary: Record<string, string>;
  editorial_structure: Record<string, unknown>;
  citation_rules: Record<string, unknown>;
}
