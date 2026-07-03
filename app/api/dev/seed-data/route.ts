import { NextResponse } from "next/server";

import {
  createProductionDevRouteResponse,
  isProductionEnvironment,
} from "@/lib/api/dev-route-guard";
import { getPrismaClient } from "@/lib/prisma";
import { UserService } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

const marcusSlug = "marcus";

export async function GET() {
  if (isProductionEnvironment()) {
    return createProductionDevRouteResponse();
  }

  try {
    const prisma = getPrismaClient();
    const user = await new UserService().getDevelopmentUser();

    const mentor = await prisma.mentor.findUnique({
      select: {
        id: true,
      },
      where: {
        slug: marcusSlug,
      },
    });

    if (!mentor) {
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
