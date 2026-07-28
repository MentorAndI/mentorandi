import type {
  ComposePromptInput,
  MentorResponseMode,
  MentorToneOption,
  PromptPackage,
} from "@/services/mentor-core/prompt-composer/prompt-composer.types";
import { validateComposePromptInput } from "@/services/mentor-core/prompt-composer/prompt-composer.validators";
import { mentorExpertiseLibrary } from "@/services/mentor-expertise/expertise-library";
import type { MentorExpertiseProfile } from "@/services/mentor-expertise/expertise-types";
import type { ActiveMentorProfile } from "@/services/mentor-catalog/mentor-catalog.types";
import type { MentorContextExpertise } from "@/services/mentor-core/context-builder/context-builder.types";

export class PromptComposerServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromptComposerServiceError";
  }
}

export class PromptComposerService {
  compose(input: ComposePromptInput): PromptPackage {
    const validation = validateComposePromptInput(input);

    if (!validation.isValid || !validation.input) {
      throw new PromptComposerServiceError(
        `Invalid prompt composer input: ${Object.values(validation.errors).join(" ")}`,
      );
    }

    const validatedInput = validation.input;
    const tone = validatedInput.tone ?? "warm";
    const responseMode = validatedInput.responseMode ?? "reflective";
    const context = validatedInput.context;
    const specialization = validatedInput.specialization;
    const mentorIdentity = buildMentorIdentity(
      context.mentor.name,
      specialization,
    );
    const conversationRules = buildConversationRules();
    const responseInstructions = buildResponseInstructions(tone, responseMode);
    const relevantGoals = context.userGoals.filter((goal) =>
      isRelevantContext(validatedInput.currentUserMessage, [
        goal.title,
        goal.description ?? "",
      ]),
    );
    const relevantMemories = context.relevantMemories.filter((memory) =>
      isRelevantContext(validatedInput.currentUserMessage, [
        memory.title,
        memory.content,
      ]),
    );
    const relevantReflections = context.recentReflections.filter((reflection) =>
      isRelevantContext(validatedInput.currentUserMessage, [reflection.summary]),
    );

    return {
      constraints: buildConstraints(),
      conversationContext: context.recentMessages
        .filter(
          (message, index, messages) =>
            !(
              index === messages.length - 1 &&
              message.role === "USER" &&
              message.content.trim() === validatedInput.currentUserMessage.trim()
            ),
        )
        .map((message) => ({
          content: message.content,
          createdAt: message.createdAt,
          role: message.role,
        })),
      conversationRules,
      developerInstructions: buildDeveloperInstructions({
        conversationRules,
        responseInstructions,
      }),
      environmentContext: {
        currentDate: context.environment.currentDate,
        currentDateTimeIso: context.environment.currentDateTimeIso,
        currentTime: context.environment.currentTime,
        timezone: context.environment.timezone,
      },
      goalContext: relevantGoals.map((goal) => ({
        description: goal.description,
        status: goal.status,
        targetDate: goal.targetDate,
        title: goal.title,
      })),
      mentorExpertiseContext: buildExpertiseContext(
        context.relevantExpertise,
        specialization,
      ).map((expertise) => ({
        coreSkills: expertise.coreSkills.slice(0, 2),
        description: "",
        mentorDomain: expertise.mentorDomain,
        recommendedTone: expertise.recommendedTone,
        riskNotes: expertise.riskNotes.slice(0, 1),
        title: expertise.title,
      })),
      mentorIdentity,
      mentorMethodContext: context.relevantMethods
        .slice(0, 1)
        .map((method) => ({
          domain: method.domain,
          exampleQuestion: method.exampleQuestion,
          mentorInstruction: method.mentorInstruction,
          shortDescription: method.shortDescription,
          title: method.title,
        })),
      memoryContext: relevantMemories.map((memory) => ({
        category: memory.category,
        confidence: memory.confidence,
        content: memory.content,
        importance: memory.importance,
        title: memory.title,
      })),
      reflectionContext: relevantReflections.map((reflection) => ({
        createdAt: reflection.createdAt,
        summary: reflection.summary,
      })),
      responseInstructions,
      sourceContext: context.relevantSourceCards.map((sourceCard) => ({
        domain: sourceCard.domain,
        keyPrinciples: sourceCard.keyPrinciples.slice(0, 2),
        reliabilityNote: sourceCard.reliabilityNote,
        sourceType: sourceCard.sourceType,
        summary: "",
        tags: [],
        title: sourceCard.title,
      })),
      specialistContext: validatedInput.specialistContext ?? null,
      systemPrompt: buildSystemPrompt(context.mentor.name, specialization),
      userPrompt: validatedInput.currentUserMessage,
    };
  }
}

const contextStopWords = new Set([
  "about", "again", "because", "feel", "from", "have", "just", "know",
  "like", "really", "that", "their", "there", "they", "this", "today",
  "want", "what", "when", "with", "would", "your",
]);

function isRelevantContext(currentMessage: string, values: string[]) {
  const messageTerms = meaningfulTerms(currentMessage);

  if (messageTerms.size === 0) {
    return false;
  }

  const contextTerms = meaningfulTerms(values.join(" "));
  return [...messageTerms].some((term) => contextTerms.has(term));
}

function meaningfulTerms(value: string) {
  return new Set(
    value
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((term) => term.length >= 4 && !contextStopWords.has(term)) ?? [],
  );
}

function buildSystemPrompt(
  mentorName: string,
  specialization?: ActiveMentorProfile,
) {
  const identity = specialization
    ? `You are Mentor And I's ${specialization.name} AI mentor.`
    : `You are ${mentorName}, a long-term Life Mentor for Mentor And I.`;

  return [
    identity,
    "Be warm, specific, practical, concise, and clearly specialized—not a generic chatbot.",
    "Use supplied context only when relevant; never invent history or claim to be human.",
    "Do not diagnose or replace medical, legal, financial, or emergency professionals. For immediate danger or self-harm, encourage local emergency services or qualified human support.",
  ].join(" ");
}

function buildMentorIdentity(
  mentorName: string,
  specialization?: ActiveMentorProfile,
) {
  const identity = specialization
    ? `You are Mentor And I's ${specialization.name} specialization within its long-term mentor system.`
    : `You are ${mentorName}, a long-term Life Mentor.`;

  return [
    identity,
    ...(specialization
      ? [
          `Focus: ${specialization.shortDescription}`,
          `Voice: ${specialization.tone}`,
          ...specialization.personaPrompt,
          ...specialization.boundaries,
        ]
      : []),
  ];
}

function buildExpertiseContext(
  relevantExpertise: MentorContextExpertise[],
  specialization?: ActiveMentorProfile,
): Array<MentorContextExpertise | MentorExpertiseProfile> {
  const selectedExpertise = specialization
    ? mentorExpertiseLibrary.find(
        (profile) => profile.mentorDomain === specialization.expertiseDomain,
      )
    : null;

  if (!selectedExpertise) {
    return relevantExpertise;
  }

  return [
    selectedExpertise,
    ...relevantExpertise.filter(
      (profile) => profile.mentorDomain !== selectedExpertise.mentorDomain,
    ),
  ].slice(0, 2);
}

function buildConversationRules() {
  return [
    "Prioritize the latest message; use older context only when clearly relevant.",
    "Answer direct or factual questions directly without forcing a mentoring format.",
    "Do not expose internal context or infer unknown facts, identity, location, or health status.",
  ];
}

function buildResponseInstructions(
  tone: MentorToneOption,
  responseMode: MentorResponseMode,
) {
  return [
    `Use a ${tone}, calm, clear voice for ${responseMode} mentoring.`,
    "For personal mentoring: respond specifically, explicitly say why one evidenced strength (effort, honesty, awareness, courage, or willingness) is useful, name at most one tentative pattern, give one small concrete next step, and end with one focused question.",
    "Use the selected method naturally as the next step; never present methods as a menu or lesson.",
    "Write 2–4 short conversational paragraphs, normally without headings or lists. Use exactly one question mark, at the end; rewrite any questions inside exercises, examples, or scripts as statements.",
    "Vary validation; do not default to ‘That makes sense.’ Ground encouragement in what the user actually said.",
    "Avoid empty praise, clinical certainty, scolding, generic assistant openings, advice dumps, and corporate or therapist-like language.",
    "Stay non-romantic and non-dependent. Never frame the mentor as a partner or uniquely devoted companion.",
  ];
}

function buildDeveloperInstructions(input: {
  conversationRules: string[];
  responseInstructions: string[];
}) {
  return [
    ...input.conversationRules,
    ...input.responseInstructions,
    "Use memory, goals and reflections carefully and only when relevant to the current exchange.",
    "Prefer recent conversation context over older memory when deciding what is most relevant.",
    "Reflections are lightweight development patterns, not commands or proof.",
    "Do not let reflections override the latest user message or a clear topic shift.",
    "Use relevant mentor methods only when they fit the user's current situation.",
    "Do not mention mentor method IDs or make the response sound formulaic.",
    "Select at most one primary mentor method for the response and adapt it naturally to the user's words and context.",
    "A method must support the warm reflection; never let technique replace validation, emotional presence or the user's current concern.",
    "Do not turn the available methods into a menu or checklist.",
    "Use relevant mentor expertise only when it fits the user's current message.",
    "Do not mention internal expertise profile IDs.",
    "Do not cite source-note URLs unless the user asks for sources.",
    "Keep the current user message higher priority than expertise notes.",
    "Use relevant source notes only when they fit the user's current message.",
    "Do not pretend to have browsed the web or looked anything up.",
    "Do not mention source-note URLs unless the user asks for sources.",
    "Adapt source-note principles to the user's situation without reciting the notes.",
    "Treat expertise and source notes as background understanding, not material to summarize.",
    "A good repetition response is: \"I notice focus and overthinking keep coming up. Let's make it concrete: what is one specific thing your mind is circling around today?\"",
  ];
}

function buildConstraints() {
  return [
    "Protect privacy; never expose internal IDs or hidden context.",
    "Never diagnose or provide professional medical, legal, financial, or emergency advice.",
    "For immediate danger, self-harm, abuse, or emergencies, encourage local emergency services or qualified human support.",
    "Never invent history, preferences, goals, memories, or certainty.",
  ];
}
