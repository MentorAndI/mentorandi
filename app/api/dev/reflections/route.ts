import { NextRequest, NextResponse } from "next/server";

import {
  createProductionDevRouteResponse,
  isProductionEnvironment,
} from "@/lib/api/dev-route-guard";
import {
  ReflectionService,
  ReflectionServiceError,
} from "@/services/reflection/reflection.service";
import {
  UserService,
  UserServiceError,
} from "@/services/user/user.service";

export const dynamic = "force-dynamic";

const maxRecentReflections = 10;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  if (isProductionEnvironment()) {
    return createProductionDevRouteResponse();
  }

  const userId = request.nextUrl.searchParams.get("userId")?.trim();

  if (userId && !uuidPattern.test(userId)) {
    return NextResponse.json(
      { errors: { userId: "User ID must be a valid UUID." } },
      { status: 400 },
    );
  }

  try {
    const resolvedUserId =
      userId ?? (await new UserService().resolveCurrentUser()).id;
    const reflections =
      await new ReflectionService().listRecentReflectionsForUserId(
        resolvedUserId,
        maxRecentReflections,
      );
    const visibleReflections = reflections.map(({ createdAt, summary }) => ({
      createdAt,
      summary,
    }));

    return NextResponse.json(
      { reflections: visibleReflections },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ReflectionServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof UserServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to load recent reflections." },
      { status: 500 },
    );
  }
}
