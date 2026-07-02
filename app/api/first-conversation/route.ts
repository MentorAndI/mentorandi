import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";
import {
  ConversationService,
  ConversationServiceError,
} from "@/services/conversation/conversation.service";
import {
  MentorResponsePipelineService,
  MentorResponsePipelineServiceError,
} from "@/services/mentor-core/response-pipeline/response-pipeline.service";
import type { MentorResponsePipelineAuthContext } from "@/services/mentor-core/response-pipeline/response-pipeline.types";

export const dynamic = "force-dynamic";

interface FirstConversationInput {
  text: string;
}

interface SeededMentorSession {
  conversationId: string | null;
  mentorId: string;
  userId: string;
}

const maxFirstConversationLength = 1200;
const marcusSlug = "marcus";
const testAuthUserId = "00000000-0000-0000-0000-000000000001";

function getFirstConversationAuthContext(): MentorResponsePipelineAuthContext {
  return {
    authUserId: null,
  };
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "First conversation requires authenticated user resolution." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const validation = validateFirstConversationInput(body);

  if (!validation.isValid || !validation.input) {
    return NextResponse.json(
      { errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const seedData = await getSeededMentorSession();
    const conversationService = new ConversationService();
    const conversation = seedData.conversationId
      ? await conversationService.getConversationForUserId(
          seedData.userId,
          seedData.conversationId,
        )
      : await conversationService.createConversationForUserId(seedData.userId, {
          mentorId: seedData.mentorId,
        });

    const pipeline = new MentorResponsePipelineService();
    const response = await pipeline.run(
      {
        conversationId: conversation.id,
        message: validation.input.text,
        provider: "mock",
        userId: seedData.userId,
      },
      getFirstConversationAuthContext(),
    );

    return NextResponse.json(
      {
        conversationId: conversation.id,
        mentorMessage: response.mentorMessage,
        userMessage: response.userMessage,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ConversationServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof MentorResponsePipelineServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to start the mentor conversation." },
      { status: 500 },
    );
  }
}

async function getSeededMentorSession(): Promise<SeededMentorSession> {
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
    throw new Error("Seeded development user or mentor was not found.");
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

  return {
    conversationId: conversation?.id ?? null,
    mentorId: mentor.id,
    userId: user.id,
  };
}

function validateFirstConversationInput(
  body: unknown,
): {
  errors: Record<string, string>;
  input?: FirstConversationInput;
  isValid: boolean;
} {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const text =
    "text" in body && typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    errors.text = "Please write a few words before continuing.";
  } else if (text.length > maxFirstConversationLength) {
    errors.text = `Please keep your answer under ${maxFirstConversationLength} characters.`;
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      isValid: false,
    };
  }

  return {
    errors,
    input: {
      text,
    },
    isValid: true,
  };
}
