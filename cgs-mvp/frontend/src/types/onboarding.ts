/**
 * Onboarding Types — adapted from existing_code/onboarding_v2
 * Mapped to our FastAPI backend (POST /api/v1/onboarding/start, etc.)
 */

// Session states matching backend
export type SessionState =
  | "started"
  | "researching"
  | "questions_ready"
  | "answering"
  | "processing"
  | "completed"
  | "failed";

export interface QuestionResponse {
  id: string;
  question: string;
  reason: string;
  expected_response_type: "string" | "select" | "boolean" | "number";
  options?: string[];
  required: boolean;
}

export interface StartOnboardingRequest {
  brand_name: string;
  website?: string;
  email: string;
  additional_context?: string;
}

export interface StartOnboardingResponse {
  session_id: string;
  questions: QuestionResponse[];
  research_summary: string;
}

export interface SubmitAnswersResponse {
  context_id: string;
  cards_count: number;
}

export interface SessionStatusResponse {
  id: string;
  user_id: string;
  status: SessionState;
  brand_name: string;
  website?: string;
  questions?: QuestionResponse[];
  research_data?: Record<string, unknown>;
  context_id?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
