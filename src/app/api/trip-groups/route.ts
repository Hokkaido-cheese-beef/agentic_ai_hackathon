import { NextResponse } from "next/server";
import { getTripGroupRepository } from "@/lib/container";
import { createTripGroupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createTripGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "入力が不正です" },
        { status: 400 }
      );
    }

    const { name, departure } = parsed.data;

    const tripGroup = await (await getTripGroupRepository()).create({
      name: name.trim(),
      departure: departure?.trim() || null,
    });

    return NextResponse.json({ tripGroup }, { status: 201 });
  } catch (error) {
    console.error("Failed to create trip group", error);
    return NextResponse.json(
      { error: "グループの作成に失敗しました" },
      { status: 500 }
    );
  }
}
