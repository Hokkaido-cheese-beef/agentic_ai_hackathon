import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <Link
        href="/trip-groups/new"
        className="rounded-full bg-black px-6 py-3 text-base font-semibold text-white transition hover:bg-zinc-800"
      >
        グループを作成
      </Link>
    </main>
  );
}
