/**
 * デモモード用 Prisma Client 互換オブジェクト
 * demoStore をバックエンドとして使用
 */
import { demoStore } from "./store";
import { seedDemoData } from "./mock-data";
import type { TripCandidate } from "@/types";

// 初期データ投入（初回のみ）
let seeded = false;
function ensureSeeded() {
  if (!seeded) {
    seeded = true;
    seedDemoData();
  }
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const demoPrisma = {
  tripGroup: {
    create({ data }: { data: { name: string; departure?: string | null; status: string } }) {
      ensureSeeded();
      const group = {
        trip_group_id: generateUUID(),
        name: data.name,
        departure: data.departure ?? null,
        status: (data.status || "draft") as "draft" | "active" | "completed",
        created_at: new Date().toISOString(),
      };
      demoStore.addTripGroup(group);
      return Promise.resolve(group);
    },
    findUnique({ where }: { where: { trip_group_id: string } }) {
      ensureSeeded();
      return Promise.resolve(demoStore.getTripGroup(where.trip_group_id) ?? null);
    },
  },

  tripCandidate: {
    create({ data }: { data: { name: string; source_url?: string | null; trip_group_id: string } }) {
      ensureSeeded();
      const candidate: TripCandidate = {
        id: generateUUID(),
        trip_group_id: data.trip_group_id,
        name: data.name,
        description: null,
        image_url: null,
        rating: null,
        review_count: null,
        tags: [],
        info: null,
        ai_summary: null,
        source_url: data.source_url ?? null,
        created_at: new Date().toISOString(),
      };
      demoStore.addCandidate(candidate);
      return Promise.resolve({
        ...candidate,
        tags: null,
        ai_summary: null,
      });
    },
    findMany({ where, orderBy }: { where: { trip_group_id: string }; orderBy?: { created_at: string } }) {
      ensureSeeded();
      void orderBy;
      const candidates = demoStore.getCandidatesByGroup(where.trip_group_id);
      return Promise.resolve(
        candidates.map((c) => ({
          ...c,
          tags: JSON.stringify(c.tags),
          ai_summary: c.ai_summary ? JSON.stringify(c.ai_summary) : null,
        }))
      );
    },
    findUnique({ where }: { where: { id: string } }) {
      ensureSeeded();
      const c = demoStore.getCandidate(where.id);
      if (!c) return Promise.resolve(null);
      return Promise.resolve({
        ...c,
        tags: JSON.stringify(c.tags),
        ai_summary: c.ai_summary ? JSON.stringify(c.ai_summary) : null,
      });
    },
    update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      ensureSeeded();
      const existing = demoStore.getCandidate(where.id);
      if (!existing) return Promise.resolve(null);
      // tags/ai_summary は JSON 文字列で保存される場合とオブジェクトの場合がある
      const parsed: Partial<TripCandidate> = {};
      for (const [key, value] of Object.entries(data)) {
        if (key === "tags" && typeof value === "string") {
          parsed.tags = JSON.parse(value);
        } else if (key === "ai_summary" && typeof value === "string") {
          parsed.ai_summary = JSON.parse(value);
        } else {
          (parsed as Record<string, unknown>)[key] = value;
        }
      }
      demoStore.updateCandidate(where.id, parsed);
      const updated = demoStore.getCandidate(where.id)!;
      return Promise.resolve({
        ...updated,
        tags: JSON.stringify(updated.tags),
        ai_summary: updated.ai_summary ? JSON.stringify(updated.ai_summary) : null,
      });
    },
  },

  question: {
    create({ data }: { data: { content: string; candidate_id?: string | null; trip_group_id: string } }) {
      ensureSeeded();
      const question = {
        id: generateUUID(),
        candidate_id: data.candidate_id ?? null,
        trip_group_id: data.trip_group_id,
        content: data.content,
        ai_answer: null,
        created_at: new Date().toISOString(),
      };
      demoStore.addQuestion(question);
      return Promise.resolve(question);
    },
    update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      ensureSeeded();
      demoStore.updateQuestion(where.id, data as Partial<{ ai_answer: string | null }>);
      return Promise.resolve(demoStore.getQuestion(where.id));
    },
  },
} as unknown as import("@prisma/client").PrismaClient;
