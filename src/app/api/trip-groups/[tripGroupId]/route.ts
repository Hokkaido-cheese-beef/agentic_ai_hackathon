import { NextResponse } from "next/server";
import { getTripGroupRepository } from "@/lib/container";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripGroupId: string }> }
) {
  try {
    const { tripGroupId } = await params;

    const tripGroup = await (await getTripGroupRepository()).findById(tripGroupId);

    if (!tripGroup) {
      return NextResponse.json(
        { error: "グループが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tripGroup });
  } catch (error) {
    console.error("Failed to get trip group", error);
    return NextResponse.json(
      { error: "エラーが発生しました" },
      { status: 500 }
    );
  }
}
