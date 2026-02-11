/**
 * DI コンテナ
 * isDemoMode() 判定はこのファイルの private 関数のみ
 * シングルトンキャッシュで同じインスタンスを再利用
 */
import type { ITripGroupRepository, ICandidateRepository, IQuestionRepository } from "./repositories/interfaces";
import type { IAiService } from "./services/interfaces";

function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

// シングルトンキャッシュ
let tripGroupRepo: ITripGroupRepository | null = null;
let candidateRepo: ICandidateRepository | null = null;
let questionRepo: IQuestionRepository | null = null;
let aiService: IAiService | null = null;

// 遅延ロード用プロミスキャッシュ
let demoRepoModule: typeof import("./repositories/demo-repository") | null = null;
let firestoreRepoModule: typeof import("./repositories/firestore-repository") | null = null;
let aiServiceModule: typeof import("./services/go-ai-service") | null = null;
let demoAiServiceModule: typeof import("./services/demo-ai-service") | null = null;

async function loadDemoRepo() {
  if (!demoRepoModule) demoRepoModule = await import("./repositories/demo-repository");
  return demoRepoModule;
}

async function loadFirestoreRepo() {
  if (!firestoreRepoModule) firestoreRepoModule = await import("./repositories/firestore-repository");
  return firestoreRepoModule;
}

async function loadDemoAiService() {
  if (!demoAiServiceModule) demoAiServiceModule = await import("./services/demo-ai-service");
  return demoAiServiceModule;
}

async function loadGoAiService() {
  if (!aiServiceModule) aiServiceModule = await import("./services/go-ai-service");
  return aiServiceModule;
}

export async function getTripGroupRepository(): Promise<ITripGroupRepository> {
  if (!tripGroupRepo) {
    if (isDemoMode()) {
      const mod = await loadDemoRepo();
      tripGroupRepo = new mod.DemoTripGroupRepository();
    } else {
      const repo = await loadFirestoreRepo();
      tripGroupRepo = new repo.FirestoreTripGroupRepository();
    }
  }
  return tripGroupRepo;
}

export async function getCandidateRepository(): Promise<ICandidateRepository> {
  if (!candidateRepo) {
    if (isDemoMode()) {
      const mod = await loadDemoRepo();
      candidateRepo = new mod.DemoCandidateRepository();
    } else {
      const repo = await loadFirestoreRepo();
      candidateRepo = new repo.FirestoreCandidateRepository();
    }
  }
  return candidateRepo;
}

export async function getQuestionRepository(): Promise<IQuestionRepository> {
  if (!questionRepo) {
    if (isDemoMode()) {
      const mod = await loadDemoRepo();
      questionRepo = new mod.DemoQuestionRepository();
    } else {
      const repo = await loadFirestoreRepo();
      questionRepo = new repo.FirestoreQuestionRepository();
    }
  }
  return questionRepo;
}

export async function getAiService(): Promise<IAiService> {
  if (aiService) {
    return aiService;
  }

  if (isDemoMode()) {
    const mod = await loadDemoAiService();
    aiService = new mod.DemoAiService();
    return aiService;
  }

  const mod = await loadGoAiService();
  aiService = new mod.GoAiService();
  return aiService;
}
