/**
 * Card Types — copied from existing_code/onboarding_v2/types/cards.ts
 * All 8 card types with labels and descriptions.
 */

export enum CardType {
  PRODUCT = "product",
  TARGET = "target",
  CAMPAIGNS = "campaigns",
  TOPIC = "topic",
  BRAND_VOICE = "brand_voice",
  COMPETITOR = "competitor",
  PERFORMANCE = "performance",
  FEEDBACK = "feedback",
}

export interface BaseCard {
  id: string;
  type: CardType;
  title: string;
  card_type: string;
  context_id: string;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductCard extends BaseCard {
  type: CardType.PRODUCT;
  content: {
    valueProposition: string;
    features: string[];
    differentiators: string[];
    useCases: string[];
    performanceMetrics: { metric: string; value: string }[];
  };
}

export interface TargetCard extends BaseCard {
  type: CardType.TARGET;
  content: {
    icpName: string;
    description: string;
    painPoints: string[];
    goals: string[];
    preferredLanguage: string;
    communicationChannels: string[];
    demographics?: {
      ageRange?: string;
      location?: string;
      role?: string;
      industry?: string;
    };
  };
}

export interface BrandVoiceCard extends BaseCard {
  type: CardType.BRAND_VOICE;
  content: {
    toneDescription: string;
    styleGuidelines: string[];
    dosExamples: string[];
    dontsExamples: string[];
    termsToUse: string[];
    termsToAvoid: string[];
  };
}

export interface CompetitorCard extends BaseCard {
  type: CardType.COMPETITOR;
  content: {
    competitorName: string;
    positioning: string;
    keyMessages: string[];
    strengths: string[];
    weaknesses: string[];
    differentiationOpportunities: string[];
  };
}

export interface TopicCard extends BaseCard {
  type: CardType.TOPIC;
  content: {
    description: string;
    keywords: string[];
    angles: string[];
    relatedContent: { title: string; type: string; url?: string }[];
    trends: { trend: string; relevance: "high" | "medium" | "low" }[];
  };
}

export interface CampaignsCard extends BaseCard {
  type: CardType.CAMPAIGNS;
  content: {
    objective: string;
    keyMessages: string[];
    tone: string;
    assets: { name: string; type: string; status: string }[];
    results?: { metric: string; value: string; trend?: "up" | "down" | "stable" }[];
    learnings: string[];
  };
}

export interface PerformanceCard extends BaseCard {
  type: CardType.PERFORMANCE;
  content: {
    period: string;
    metrics: {
      channel: string;
      contentType: string;
      ctr?: number;
      engagement?: number;
      conversions?: number;
      impressions?: number;
    }[];
    topPerformingContent: { title: string; type: string; metric: string; value: string }[];
    insights: string[];
  };
}

export interface FeedbackCard extends BaseCard {
  type: CardType.FEEDBACK;
  content: {
    source: "customer_feedback" | "team_feedback" | "ab_test" | "analytics" | "other";
    summary: string;
    details: string;
    actionItems: string[];
    priority: "high" | "medium" | "low";
  };
}

export type Card =
  | ProductCard
  | TargetCard
  | BrandVoiceCard
  | CompetitorCard
  | TopicCard
  | CampaignsCard
  | PerformanceCard
  | FeedbackCard;

export const CardTypeLabels: Record<CardType, string> = {
  [CardType.PRODUCT]: "Product/Service",
  [CardType.TARGET]: "Target",
  [CardType.CAMPAIGNS]: "Campaigns",
  [CardType.TOPIC]: "Topic",
  [CardType.BRAND_VOICE]: "Brand Voice",
  [CardType.COMPETITOR]: "Competitor",
  [CardType.PERFORMANCE]: "Performance",
  [CardType.FEEDBACK]: "Feedback",
};

export const CardTypeDescriptions: Record<CardType, string> = {
  [CardType.PRODUCT]: "Value proposition, features, differentiators, use cases and metrics",
  [CardType.TARGET]: "ICP profile, pain points, goals, language and channels",
  [CardType.CAMPAIGNS]: "Objectives, key messages, tone, assets and results",
  [CardType.TOPIC]: "Recurring topics, keywords, angles and trends",
  [CardType.BRAND_VOICE]: "Style guidelines, tone, do/don't examples",
  [CardType.COMPETITOR]: "Positioning, messaging, gaps and opportunities",
  [CardType.PERFORMANCE]: "CTR, engagement, conversions by content and channel",
  [CardType.FEEDBACK]: "Learnings from customers, team and A/B tests",
};

export const CardTypeIcons: Record<CardType, string> = {
  [CardType.PRODUCT]: "📦",
  [CardType.TARGET]: "🎯",
  [CardType.CAMPAIGNS]: "📢",
  [CardType.TOPIC]: "💡",
  [CardType.BRAND_VOICE]: "🎨",
  [CardType.COMPETITOR]: "🏆",
  [CardType.PERFORMANCE]: "📊",
  [CardType.FEEDBACK]: "💬",
};
