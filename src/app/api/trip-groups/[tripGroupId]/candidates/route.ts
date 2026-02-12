import { NextResponse } from "next/server";
import { getTripGroupRepository, getCandidateRepository } from "@/lib/container";
import { createCandidateSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripGroupId: string }> }
) {
  try {
    const { tripGroupId } = await params;

    const candidates = await (await getCandidateRepository()).findByGroupId(tripGroupId);

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("Failed to get candidates", error);
    return NextResponse.json(
      { error: "エラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripGroupId: string }> }
) {
  try {
    const { tripGroupId } = await params;
    const body = await request.json();
    const validated = createCandidateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message ?? "入力が不正です" },
        { status: 400 }
      );
    }

    const { name, source_url, createdBy } = validated.data;

    const tripGroup = await (await getTripGroupRepository()).findById(tripGroupId);

    if (!tripGroup) {
      return NextResponse.json(
        { error: "グループが見つかりません" },
        { status: 404 }
      );
    }

    const candidate = await (await getCandidateRepository()).create({
      name: name.trim(),
      sourceUrl: source_url ?? null,
      tripGroupId,
      createdBy,
    });

    return NextResponse.json({ candidate }, { status: 201 });
  } catch (error) {
    console.error("Failed to create candidate", error);
    return NextResponse.json(
      { error: "候補の追加に失敗しました" },
      { status: 500 }
    );
  }
}
