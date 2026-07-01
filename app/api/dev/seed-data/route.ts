import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const testAuthUserId = "00000000-0000-0000-0000-000000000001";
const marcusSlug = "marcus";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This development seed data endpoint is disabled in production." },
      { status: 403 },
    );
  }

  try {
    const prisma = getPrismaClient();

    const [user, mentor] = await Promise.all([
      prisma.user.findUnique({
        select: {
          id: true,
        },
        where: {
          authUserId: testAuthUserId,
        },
      }),
      prisma.mentor.findUnique({
        select: {
          id: true,
        },
        where: {
          slug: marcusSlug,
        },
      }),
    ]);

    if (!user || !mentor) {
      return NextResponse.json(
        { error: "Seeded development user or mentor was not found." },
        { status: 404 },
      );
    }

    const conversation = await prisma.conversation.findFirst({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
      },
      where: {
        mentorId: mentor.id,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        conversationId: conversation?.id ?? null,
        mentorId: mentor.id,
        userId: user.id,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load seeded development data." },
      { status: 500 },
    );
  }
}
