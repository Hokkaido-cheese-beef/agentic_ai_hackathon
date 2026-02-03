import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import CopyableField from "@/components/copyable-field";
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

  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocolHeader = headerList.get("x-forwarded-proto");
  const protocol = protocolHeader ?? (host.includes("localhost") ? "http" : "https");
  const inviteUrl = `${protocol}://${host}/trip-groups/${tripGroupId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    inviteUrl
  )}`;

  const tripGroup = await prisma.tripGroup.findUnique({
    where: { trip_group_id: tripGroupId },
  });

  if (!tripGroup) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center gap-10 px-6 py-16 text-center sm:px-8">
        <div>

          <h1 className="mt-3 text-4xl font-semibold text-zinc-900 sm:text-5xl">
            {tripGroup.name}
          </h1>
        </div>
        <div className="grid w-full gap-6 lg:grid-cols-[1fr_280px]">
          <div className="rounded-3xl border border-zinc-200 bg-white/90 px-8 py-8 text-left shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
            <h2 className="text-lg font-semibold text-zinc-900">招待リンク</h2>
            <p className="mt-2 text-sm text-zinc-500">
              下のリンクを共有するとメンバーを簡単に招待できます。
            </p>
            <CopyableField value={inviteUrl} className="mt-5" />
            <p className="mt-3 text-xs text-zinc-500">
              コピーしてメッセージやメールで共有してください。
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-zinc-300 bg-white/80 px-6 py-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
              QR Code
            </p>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <img
                src={qrCodeUrl}
                alt="グループ招待QRコード"
                width={220}
                height={220}
                className="h-52 w-52 object-contain"
              />
            </div>
            <p className="text-xs text-zinc-500">スマホで読み取ると招待ページが開きます。</p>
          </div>
        </div>
        <Link href="/" className="text-sm font-semibold text-black underline">
          トップに戻る
        </Link>
      </div>
    </main>
  );
}
