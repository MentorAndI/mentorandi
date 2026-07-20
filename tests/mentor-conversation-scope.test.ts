import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";

import { getPrismaClient } from "@/lib/prisma";
import { ConversationService } from "@/services/conversation/conversation.service";
import { getActiveMentorProfile } from "@/services/mentor-catalog/mentor-catalog";
import { MessageService } from "@/services/message/message.service";

const prisma = getPrismaClient();
const createdAuthUserIds: string[] = [];

after(async () => {
  if (createdAuthUserIds.length === 0) {
    return;
  }

  await prisma.user.deleteMany({
    where: {
      authUserId: { in: createdAuthUserIds },
    },
  });
});

test("mentor conversations keep confidence, ADHD, and legacy Life messages isolated", async () => {
  const authUserId = randomUUID();
  createdAuthUserIds.push(authUserId);

  const user = await prisma.user.create({ data: { authUserId } });
  const conversationService = new ConversationService();
  const messageService = new MessageService();
  const confidenceProfile = requireProfile("confidence");
  const adhdProfile = requireProfile("adhd");
  const lifeProfile = requireProfile("life");

  const confidenceConversation =
    await conversationService.getOrCreateConversationForUserAndMentorSlug(
      user.id,
      confidenceProfile.databaseSlug,
    );
  const adhdConversation =
    await conversationService.getOrCreateConversationForUserAndMentorSlug(
      user.id,
      adhdProfile.databaseSlug,
    );
  const legacyLifeConversation =
    await conversationService.getOrCreateConversationForUserAndMentorSlug(
      user.id,
      lifeProfile.databaseSlug,
    );

  assert.notEqual(confidenceConversation.id, adhdConversation.id);
  assert.notEqual(confidenceConversation.id, legacyLifeConversation.id);
  assert.notEqual(adhdConversation.id, legacyLifeConversation.id);
  assert.equal(legacyLifeConversation.mentor.slug, "marcus");

  await messageService.createMessage(
    confidenceConversation.id,
    { content: "confidence-only-message", role: "USER" },
    { authUserId },
  );
  await messageService.createMessage(
    adhdConversation.id,
    { content: "adhd-only-message", role: "USER" },
    { authUserId },
  );
  await messageService.createMessage(
    legacyLifeConversation.id,
    { content: "legacy-life-only-message", role: "USER" },
    { authUserId },
  );

  const confidenceMessages = await messageService.getMessagesForConversation(
    confidenceConversation.id,
    { authUserId },
  );
  const adhdMessages = await messageService.getMessagesForConversation(
    adhdConversation.id,
    { authUserId },
  );
  const lifeMessages = await messageService.getMessagesForConversation(
    legacyLifeConversation.id,
    { authUserId },
  );

  assert.deepEqual(
    confidenceMessages.map((message) => message.content),
    ["confidence-only-message"],
  );
  assert.deepEqual(
    adhdMessages.map((message) => message.content),
    ["adhd-only-message"],
  );
  assert.deepEqual(
    lifeMessages.map((message) => message.content),
    ["legacy-life-only-message"],
  );

  const resolvedConfidence =
    await conversationService.getOrCreateConversationForUserAndMentorSlug(
      user.id,
      confidenceProfile.databaseSlug,
    );
  const resolvedAdhd =
    await conversationService.getOrCreateConversationForUserAndMentorSlug(
      user.id,
      adhdProfile.databaseSlug,
    );

  assert.equal(resolvedConfidence.id, confidenceConversation.id);
  assert.equal(resolvedAdhd.id, adhdConversation.id);
});

function requireProfile(slug: "adhd" | "confidence" | "life") {
  const profile = getActiveMentorProfile(slug);

  assert.ok(profile);

  return profile;
}
