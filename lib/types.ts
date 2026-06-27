// Shared types for the Cooked Meter analysis contract.

export type Priority = "high" | "medium" | "low";

export interface KeyTopic {
  topic: string;
  priority: Priority;
  why: string;
}

export interface StudyPlanItem {
  when: string;
  focus: string;
}

export interface AnalysisResult {
  /** Funny but caring verdict — always ends constructively. */
  roast: string;
  /** 0–100, higher = more cooked / less prepared. */
  cooked_level: number;
  key_topics: KeyTopic[];
  quick_wins: string[];
  study_plan: StudyPlanItem[];
}

export interface AnalyzeRequest {
  examText: string;
  knowledgeLevel: string;
  daysLeft?: number | null;
  /** Language for the AI's reply: "ru" or "en". */
  lang?: "ru" | "en";
}
