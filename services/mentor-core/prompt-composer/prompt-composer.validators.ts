import type {
  ComposePromptInput,
  MentorResponseMode,
  MentorToneOption,
  PromptComposerValidationResult,
} from "@/services/mentor-core/prompt-composer/prompt-composer.types";

const supportedTones: MentorToneOption[] = [
  "calm",
  "direct",
  "warm",
  "challenging",
];
const supportedResponseModes: MentorResponseMode[] = [
  "reflective",
  "practical",
  "accountability",
];
const maxUserMessageLength = 10000;

export function validateComposePromptInput(
  input: ComposePromptInput,
): PromptComposerValidationResult<ComposePromptInput> {
  const errors: Record<string, string> = {};

  if (!input.context) {
    errors.context = "Mentor context is required.";
  }

  if (!input.currentUserMessage.trim()) {
    errors.currentUserMessage = "Current user message is required.";
  } else if (input.currentUserMessage.length > maxUserMessageLength) {
    errors.currentUserMessage = `Current user message must be ${maxUserMessageLength} characters or fewer.`;
  }

  if (input.tone && !supportedTones.includes(input.tone)) {
    errors.tone = "Tone must be calm, direct, warm, or challenging.";
  }

  if (
    input.responseMode &&
    !supportedResponseModes.includes(input.responseMode)
  ) {
    errors.responseMode =
      "Response mode must be reflective, practical, or accountability.";
  }

  return {
    errors,
    input: Object.keys(errors).length === 0 ? input : undefined,
    isValid: Object.keys(errors).length === 0,
  };
}
