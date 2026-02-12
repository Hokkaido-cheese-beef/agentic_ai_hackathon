/**
 * デモモード用インメモリ リアクティブストア
 * Map ベース + EventEmitter パターンで onSnapshot を模擬
 */
import type { TripGroup, TripCandidate, Question } from "@/types";

type Listener = () => void;

class DemoStore {
  private tripGroups = new Map<string, TripGroup>();
  private candidates = new Map<string, TripCandidate>();
  private questions = new Map<string, Question>();
  private listeners = new Map<string, Set<Listener>>();

  // --- Subscribe ---
  subscribe(path: string, callback: Listener): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path)!.add(callback);
    // 初回発火
    callback();
    return () => {
      this.listeners.get(path)?.delete(callback);
    };
  }

  private notify(path: string) {
    this.listeners.get(path)?.forEach((cb) => cb());
  }

  // --- TripGroup ---
  addTripGroup(group: TripGroup) {
    this.tripGroups.set(group.trip_group_id, group);
    this.notify("tripGroups");
  }

  getTripGroup(id: string): TripGroup | undefined {
    return this.tripGroups.get(id);
  }

  // --- Candidate ---
  addCandidate(candidate: TripCandidate) {
    this.candidates.set(candidate.id, candidate);
    this.notify(`tripGroups/${candidate.trip_group_id}/candidates`);
  }

  updateCandidate(id: string, data: Partial<TripCandidate>) {
    const existing = this.candidates.get(id);
    if (!existing) return;
    const updated = { ...existing, ...data };
    this.candidates.set(id, updated);
    this.notify(`tripGroups/${updated.trip_group_id}/candidates`);
  }

  getCandidate(id: string): TripCandidate | undefined {
    return this.candidates.get(id);
  }

  getCandidatesByGroup(tripGroupId: string): TripCandidate[] {
    return Array.from(this.candidates.values())
      .filter((c) => c.trip_group_id === tripGroupId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  // --- Question ---
  addQuestion(question: Question) {
    this.questions.set(question.id, question);
    this.notify(`tripGroups/${question.trip_group_id}/questions`);
  }

  updateQuestion(id: string, data: Partial<Question>) {
    const existing = this.questions.get(id);
    if (!existing) return;
    const updated = { ...existing, ...data };
    this.questions.set(id, updated);
    this.notify(`tripGroups/${updated.trip_group_id}/questions`);
  }

  getQuestion(id: string): Question | undefined {
    return this.questions.get(id);
  }

  getQuestionsByGroup(tripGroupId: string): Question[] {
    return Array.from(this.questions.values())
      .filter((q) => q.trip_group_id === tripGroupId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
}

// globalThis でシングルトン永続化（チャンク境界を超えてインスタンスを維持）
// 注意: instanceof は使わない。チャンク再読み込みで DemoStore クラスが再定義されると
// 旧インスタンスに対して instanceof が false を返し、データが消失するため。
const STORE_KEY = "__tripvote_demo_store__";
function getOrCreateStore(): DemoStore {
  const g = globalThis as Record<string, unknown>;
  if (g[STORE_KEY] && typeof (g[STORE_KEY] as DemoStore).getTripGroup === "function") {
    return g[STORE_KEY] as DemoStore;
  }
  const store = new DemoStore();
  g[STORE_KEY] = store;
  return store;
}
export const demoStore = getOrCreateStore();
