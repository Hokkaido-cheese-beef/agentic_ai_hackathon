import { NextResponse } from "next/server";
import { getTripGroupRepository, getQuestionRepository } from "@/lib/container";
import { createQuestionSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripGroupId: string }> }
) {
  try {
    const { tripGroupId } = await params;
    const body = await request.json();
    const validated = createQuestionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message ?? "入力が不正です" },
        { status: 400 }
      );
    }

    const { content, candidate_id } = validated.data;

    const tripGroup = await (await getTripGroupRepository()).findById(tripGroupId);

    if (!tripGroup) {
      return NextResponse.json(
        { error: "グループが見つかりません" },
        { status: 404 }
      );
    }

    const question = await (await getQuestionRepository()).create({
      content: content.trim(),
      candidateId: candidate_id ?? null,
      tripGroupId,
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("Failed to create question", error);
    return NextResponse.json(
      { error: "質問の保存に失敗しました" },
      { status: 500 }
    );
  }
}
