import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";

const testAuthUserId = "00000000-0000-0000-0000-000000000001";
const marcusSlug = "marcus";

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL.");
  }

  return databaseUrl;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getDatabaseUrl(),
  }),
});

async function main() {
  const user = await prisma.user.upsert({
    create: {
      authUserId: testAuthUserId,
    },
    update: {},
    where: {
      authUserId: testAuthUserId,
    },
  });

  const mentor = await prisma.mentor.upsert({
    create: {
      active: true,
      description:
        "Marcus helps people think clearly, make better decisions and stay accountable over the long term.",
      name: "Marcus",
      slug: marcusSlug,
    },
    update: {
      active: true,
      description:
        "Marcus helps people think clearly, make better decisions and stay accountable over the long term.",
      name: "Marcus",
    },
    where: {
      slug: marcusSlug,
    },
  });

  const conversation =
    (await prisma.conversation.findFirst({
      where: {
        mentorId: mentor.id,
        userId: user.id,
      },
    })) ??
    (await prisma.conversation.create({
      data: {
        mentorId: mentor.id,
        userId: user.id,
      },
    }));

  await prisma.goal.upsert({
    create: {
      description: null,
      title: "Build a more focused and confident life.",
      userId: user.id,
    },
    update: {
      description: null,
      title: "Build a more focused and confident life.",
    },
    where: {
      id: await findGoalId(user.id, "Build a more focused and confident life."),
    },
  });

  await Promise.all(
    [
      "User wants help thinking more clearly.",
      "User values honest feedback.",
      "User wants a mentor who asks good questions.",
    ].map((title) =>
      upsertMemory({
        content: title,
        conversationId: conversation.id,
        title,
        userId: user.id,
      }),
    ),
  );

  console.log("Seeded MentorAndI development data.");
  console.log(`User ID: ${user.id}`);
  console.log(`Mentor ID: ${mentor.id}`);
  console.log(`Conversation ID: ${conversation.id}`);
}

async function findGoalId(userId: string, title: string) {
  const goal = await prisma.goal.findFirst({
    select: {
      id: true,
    },
    where: {
      title,
      userId,
    },
  });

  return goal?.id ?? crypto.randomUUID();
}

async function upsertMemory(input: {
  content: string;
  conversationId: string;
  title: string;
  userId: string;
}) {
  const existingMemory = await prisma.memory.findFirst({
    select: {
      id: true,
    },
    where: {
      title: input.title,
      userId: input.userId,
    },
  });

  if (existingMemory) {
    return prisma.memory.update({
      data: {
        category: "development",
        confidence: 0.8,
        content: input.content,
        importance: 4,
        sourceConversationId: input.conversationId,
      },
      where: {
        id: existingMemory.id,
      },
    });
  }

  return prisma.memory.create({
    data: {
      category: "development",
      confidence: 0.8,
      content: input.content,
      importance: 4,
      sourceConversationId: input.conversationId,
      title: input.title,
      userId: input.userId,
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
