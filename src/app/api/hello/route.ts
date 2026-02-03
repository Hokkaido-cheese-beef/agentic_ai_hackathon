import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cheeses = await prisma.cheese.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      message: "Hello from the API!",
      timestamp: new Date().toISOString(),
      cheeses,
    });
  } catch (error) {
    console.error("Failed to load cheeses", error);
    return NextResponse.json({
      message: "Hello from the API!",
      timestamp: new Date().toISOString(),
      cheeses: [],
      databaseConnected: false,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (typeof body?.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const newCheese = await prisma.cheese.create({
      data: {
        name: body.name.trim(),
        origin: body.origin,
        description: body.description,
        agingDays: body.agingDays,
      },
    });

    return NextResponse.json({
      message: "Cheese created",
      cheese: newCheese,
    });
  } catch (error) {
    console.error("Failed to create cheese", error);
    return NextResponse.json(
      {
        error: "Failed to create cheese",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
