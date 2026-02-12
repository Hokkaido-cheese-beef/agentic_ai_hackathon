import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import CopyableField from "@/components/copyable-field";
import { getTripGroupRepository } from "@/lib/container";
import { DemoInvitePage } from "@/components/demo/DemoInvitePage";

type InvitePageProps = {
  params: Promise<{
    tripGroupId: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { tripGroupId } = await params;

  if (!tripGroupId) {
    notFound();
  }

  // デモモード: クライアント側 demoStore を参照するコンポーネントを描画
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return <DemoInvitePage tripGroupId={tripGroupId} />;
  }

  const tripGroup = await (await getTripGroupRepository()).findById(tripGroupId);

  if (!tripGroup) {
    notFound();
  }

  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "localhost:3000";
  const protocolHeader = headerList.get("x-forwarded-proto");
  const protocol =
    protocolHeader ?? (host.includes("localhost") ? "http" : "https");
  const inviteUrl = `${protocol}://${host}/trip-groups/${tripGroupId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    inviteUrl
  )}`;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-surface shadow-lg">
      <AppHeader />

      <div className="mx-auto max-w-[395px] flex flex-col gap-5 p-6">
        {/* Title Area */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            メンバーを招待
          </h1>
          <p className="text-sm text-text-secondary leading-[1.5] whitespace-pre-line">
            {"グループを作成しました！\nメンバーを招待しましょう"}
          </p>
        </div>

        {/* Group Card */}
        <div className="flex flex-col gap-2 rounded-[20px] bg-white p-5 border border-border">
          <span className="text-[13px] font-medium text-text-secondary">
            グループ名
          </span>
          <span className="text-lg font-bold text-foreground">
            {tripGroup.name}
          </span>
        </div>

        {/* Link Card */}
        <div className="flex flex-col gap-2.5 rounded-[20px] bg-white p-5 border border-border">
          <span className="text-[13px] font-medium text-text-secondary">
            招待リンク
          </span>
          <CopyableField value={inviteUrl} />
        </div>

        {/* QR Card */}
        <div className="flex flex-col items-center gap-3 rounded-[20px] bg-white p-5 border border-border">
          <span className="text-sm font-semibold text-text-body">
            QRコードで共有
          </span>
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-xl bg-surface-raised border border-border">
            <Image
              src={qrCodeUrl}
              alt="QRコード"
              width={100}
              height={100}
              className="h-[100px] w-[100px] object-contain"
              unoptimized
            />
          </div>
          <span className="text-xs text-text-muted">
            スマホのカメラで読み取れます
          </span>
        </div>

        {/* Next Button */}
        <Link
          href={`/trip-groups/${tripGroupId}/candidates`}
          className="flex h-14 items-center justify-center rounded-2xl bg-primary text-white text-base font-bold"
        >
          次へ進む →
        </Link>
      </div>
    </main>
  );
}
