import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const status =
      typeof body?.status === "string" && body.status.trim()
        ? body.status.trim()
        : "draft";

    if (!name) {
      return NextResponse.json(
        { error: "グループ名を入力してください" },
        { status: 400 }
      );
    }

    const tripGroup = await prisma.tripGroup.create({
      data: {
        name,
        status,
      },
    });

    return NextResponse.json({ tripGroup }, { status: 201 });
  } catch (error) {
    console.error("Failed to create trip group", error);
    return NextResponse.json(
      {
        error: "グループの作成に失敗しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
