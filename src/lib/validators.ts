import { z } from "zod";

// --- Trip Groups ---
export const createTripGroupSchema = z.object({
  name: z.string().min(1, "グループ名を入力してください").max(100),
  departure: z.string().max(200).nullable().optional(),
});

// --- Candidates ---
export const createCandidateSchema = z.object({
  name: z.string().min(1, "候補名を入力してください").max(200),
  source_url: z.string().url().max(2000).nullable().optional(),
  createdBy: z.string().optional(), // セッションID or ユーザーID
});

// --- Questions ---
export const createQuestionSchema = z.object({
  content: z.string().min(1, "質問内容を入力してください").max(1000),
  candidate_id: z.string().uuid().nullable().optional(),
});

// --- AI Summarize ---
export const aiSummarizeSchema = z.object({
  candidate_id: z.string().uuid("候補IDが不正です"),
  candidate_name: z.string().min(1, "候補名が必要です").max(200),
  source_url: z.string().url().max(2000).optional().nullable(),
  trip_group_id: z.string().uuid("グループIDが不正です"),
  origin: z.string().max(200).optional().nullable(),
});

// --- AI Question ---
export const aiQuestionSchema = z.object({
  question_id: z.string().uuid("質問IDが不正です"),
  question: z.string().min(1, "質問内容が必要です").max(1000),
  candidate_name: z.string().max(200).nullable().optional(),
  candidate_id: z.string().uuid().nullable().optional(),
  trip_group_id: z.string().uuid("グループIDが不正です"),
});

// --- AI Image ---
export const aiImageSchema = z.object({
  candidate_id: z.string().uuid("候補IDが不正です"),
  candidate_name: z.string().min(1, "候補名が必要です").max(200),
  trip_group_id: z.string().uuid("グループIDが不正です"),
});

// --- AI Summary Response (AI応答JSON検証) ---
const aiTagSchema = z.object({
  icon: z.string(),
  label: z.string(),
  textColor: z.string(),
  iconColor: z.string(),
  bgColor: z.string(),
});

const aiQaSchema = z.object({
  q: z.string(),
  a: z.string(),
});

export const aiSummaryResponseSchema = z.object({
  description: z.string().optional(),
  tags: z.array(aiTagSchema).optional(),
  info: z.string().optional(),
  ai_summary: z
    .object({
      headline: z.string(),
      qa: z.array(aiQaSchema),
    })
    .optional(),
});
