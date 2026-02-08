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
let prismaRepoModule: typeof import("./repositories/prisma-repository") | null = null;
let prismaModule: typeof import("./prisma") | null = null;
let aiServiceModule: typeof import("./services/ai-service") | null = null;

async function loadDemoRepo() {
  if (!demoRepoModule) demoRepoModule = await import("./repositories/demo-repository");
  return demoRepoModule;
}

async function loadPrismaRepo() {
  if (!prismaRepoModule) prismaRepoModule = await import("./repositories/prisma-repository");
  if (!prismaModule) prismaModule = await import("./prisma");
  return { prismaRepoModule, prismaModule };
}

async function loadAiService() {
  if (!aiServiceModule) aiServiceModule = await import("./services/ai-service");
  return aiServiceModule;
}

export async function getTripGroupRepository(): Promise<ITripGroupRepository> {
  if (!tripGroupRepo) {
    if (isDemoMode()) {
      const mod = await loadDemoRepo();
      tripGroupRepo = new mod.DemoTripGroupRepository();
    } else {
      const { prismaRepoModule: repo, prismaModule: db } = await loadPrismaRepo();
      tripGroupRepo = new repo.PrismaTripGroupRepository(db.prisma);
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
      const { prismaRepoModule: repo, prismaModule: db } = await loadPrismaRepo();
      candidateRepo = new repo.PrismaCandidateRepository(db.prisma);
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
      const { prismaRepoModule: repo, prismaModule: db } = await loadPrismaRepo();
      questionRepo = new repo.PrismaQuestionRepository(db.prisma);
    }
  }
  return questionRepo;
}

export async function getAiService(): Promise<IAiService> {
  if (!aiService) {
    const mod = await loadAiService();
    if (isDemoMode()) {
      aiService = new mod.DemoAiService();
    } else {
      aiService = new mod.GeminiAiService();
    }
  }
  return aiService;
}
