/**
 * デモモード用リポジトリ実装
 * demoStore をバックエンドとして使用。型安全な interface 実装。
 */
import type { TripGroup, TripCandidate, Question } from "@/types";
import type { ITripGroupRepository, ICandidateRepository, IQuestionRepository, CandidateUpdateData } from "./interfaces";
import { demoStore } from "@/lib/demo/store";
import { seedDemoData } from "@/lib/demo/mock-data";

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

export class DemoTripGroupRepository implements ITripGroupRepository {
  async create(data: {
    name: string;
    departure?: string | null;
    departure_type?: string;
    departure_value?: string;
    departure_raw?: string;
  }): Promise<TripGroup> {
    ensureSeeded();
    const group: TripGroup = {
      trip_group_id: generateUUID(),
      name: data.name,
      departure: data.departure ?? null,
      status: "draft",
      created_at: new Date().toISOString(),
      departure_type: data.departure_type as "text" | "geolocation" | "postal_code" | undefined,
      departure_value: data.departure_value,
      departure_raw: data.departure_raw,
    };
    demoStore.addTripGroup(group);
    return group;
  }

  async findById(tripGroupId: string): Promise<TripGroup | null> {
    ensureSeeded();
    return demoStore.getTripGroup(tripGroupId) ?? null;
  }
}

export class DemoCandidateRepository implements ICandidateRepository {
  async create(data: { name: string; sourceUrl?: string | null; tripGroupId: string; createdBy?: string }): Promise<TripCandidate> {
    ensureSeeded();
    const candidate: TripCandidate = {
      id: generateUUID(),
      trip_group_id: data.tripGroupId,
      name: data.name,
      description: null,
      image_url: null,
      tags: [],
      info: null,
      ai_summary: null,
      source_url: data.sourceUrl ?? null,
      created_at: new Date().toISOString(),
      createdBy: data.createdBy,
    };
    demoStore.addCandidate(candidate);
    return candidate;
  }

  async findById(_tripGroupId: string, candidateId: string): Promise<TripCandidate | null> {
    ensureSeeded();
    return demoStore.getCandidate(candidateId) ?? null;
  }

  async findByGroupId(tripGroupId: string): Promise<TripCandidate[]> {
    ensureSeeded();
    return demoStore.getCandidatesByGroup(tripGroupId);
  }

  async update(candidateId: string, _tripGroupId: string, data: Partial<CandidateUpdateData>): Promise<TripCandidate> {
    ensureSeeded();
    demoStore.updateCandidate(candidateId, data);
    return demoStore.getCandidate(candidateId)!;
  }
}

export class DemoQuestionRepository implements IQuestionRepository {
  async create(data: { content: string; candidateId?: string | null; tripGroupId: string }): Promise<Question> {
    ensureSeeded();
    const question: Question = {
      id: generateUUID(),
      candidate_id: data.candidateId ?? null,
      trip_group_id: data.tripGroupId,
      content: data.content,
      ai_answer: null,
      created_at: new Date().toISOString(),
    };
    demoStore.addQuestion(question);
    return question;
  }

  async update(questionId: string, _tripGroupId: string, data: { aiAnswer: string }): Promise<Question> {
    ensureSeeded();
    demoStore.updateQuestion(questionId, { ai_answer: data.aiAnswer });
    return demoStore.getQuestion(questionId) as Question;
  }

  async findGlobalByGroupId(tripGroupId: string): Promise<Question[]> {
    ensureSeeded();
    return demoStore.getQuestionsByGroup(tripGroupId).filter((q) => q.candidate_id === null);
  }
}
