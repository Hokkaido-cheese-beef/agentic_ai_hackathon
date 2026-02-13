import { NextResponse } from "next/server";
import { getAiService, getCandidateRepository } from "@/lib/container";
import { aiImageSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = aiImageSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message ?? "パラメータが不正です" },
        { status: 400 }
      );
    }

    const { candidate_id, candidate_name, trip_group_id } = validated.data;
    const imageUrl = await (await getAiService()).fetchImage(candidate_name);

    if (!imageUrl) {
      return NextResponse.json({ image_url: null });
    }

    const candidate = await (await getCandidateRepository()).update(candidate_id, trip_group_id, {
      image_url: imageUrl,
    });

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("Failed to fetch candidate image", error);
    return NextResponse.json(
      { error: "画像の取得に失敗しました" },
      { status: 500 }
    );
  }
}
