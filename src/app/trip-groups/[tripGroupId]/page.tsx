import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type TripGroupDetailPageProps = {
  params: Promise<{
    tripGroupId: string;
  }>;
};

export default async function TripGroupDetailPage({
  params,
}: TripGroupDetailPageProps) {
  const { tripGroupId } = await params;

  if (!tripGroupId) {
    notFound();
  }

  const tripGroup = await prisma.tripGroup.findUnique({
    where: { trip_group_id: tripGroupId },
  });

  if (!tripGroup) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 text-center">
      <div>
        <p className="text-sm text-zinc-500">グループ管理</p>
        <h1 className="text-3xl font-semibold text-zinc-900">
          {tripGroup.name}
        </h1>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white px-8 py-6 text-left shadow-sm">
        <dl className="space-y-4 text-base text-zinc-700">
          <div>
            <dt className="text-sm text-zinc-500">ステータス</dt>
            <dd className="text-lg font-semibold text-zinc-900">
              {tripGroup.status}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">グループID</dt>
            <dd className="font-mono text-sm text-zinc-800">
              {tripGroup.trip_group_id}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">作成日時</dt>
            <dd className="text-zinc-800">
              {tripGroup.created_at.toLocaleString("ja-JP")}
            </dd>
          </div>
        </dl>
      </div>
      <Link href="/" className="text-sm font-semibold text-black underline">
        トップに戻る
      </Link>
    </main>
  );
}
