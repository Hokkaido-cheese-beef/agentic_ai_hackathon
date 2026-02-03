"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TripGroupCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("グループ名を入力してください");
      return;
    }

    setIsSubmitting(true);
    fetch("/api/trip-groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: trimmedName, status: "draft" }),
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "グループ作成に失敗しました");
        }
        const createdId = payload?.tripGroup?.trip_group_id;
        if (typeof createdId === "string" && createdId.length > 0) {
          router.push(`/trip-groups/${createdId}`);
        } else {
          throw new Error("作成結果を取得できませんでした");
        }
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "グループ作成に失敗しました"
        );
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white px-4 text-center">
      <div>
        <p className="text-sm text-zinc-500">グループ管理</p>
        <h1 className="text-3xl font-semibold text-zinc-900">新しいグループを作成</h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col items-stretch gap-4 text-left"
      >
        <label className="text-sm font-medium text-zinc-600" htmlFor="group-name">
          グループ名
        </label>
        <input
          id="group-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-lg border border-zinc-200 px-4 py-3 text-base text-zinc-900 shadow-sm focus:border-black focus:outline-none"
          placeholder="例: 北海道チーズ旅"
        />
        <button
          type="submit"
          className="rounded-full bg-black px-6 py-3 text-base font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || !name.trim()}
        >
          {isSubmitting ? "作成中..." : "作成"}
        </button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Link href="/" className="text-sm font-semibold text-black underline">
        トップに戻る
      </Link>
    </main>
  );
}
