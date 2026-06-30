import type {
  CreateMemoryInput,
  MemoryFilters,
  MemoryValidationResult,
  UpdateMemoryInput,
} from "@/services/memory/memory.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const maxCategoryLength = 80;
const maxTitleLength = 160;
const maxContentLength = 10000;

export function validateMemoryId(
  memoryId: string,
): MemoryValidationResult<{ memoryId: string }> {
  const normalizedMemoryId = memoryId.trim();

  if (!normalizedMemoryId) {
    return {
      errors: { memoryId: "Memory ID is required." },
      isValid: false,
    };
  }

  if (!uuidPattern.test(normalizedMemoryId)) {
    return {
      errors: { memoryId: "Memory ID must be a valid UUID." },
      isValid: false,
    };
  }

  return {
    errors: {},
    input: { memoryId: normalizedMemoryId },
    isValid: true,
  };
}

export function validateMemoryFilters(
  searchParams: URLSearchParams,
): MemoryValidationResult<MemoryFilters> {
  const errors: Record<string, string> = {};
  const filters: MemoryFilters = {};
  const category = normalizeOptionalString(searchParams.get("category"));
  const minimumImportance = parseOptionalNumber(
    searchParams.get("minimumImportance"),
  );
  const minimumConfidence = parseOptionalNumber(
    searchParams.get("minimumConfidence"),
  );

  if (category) {
    filters.category = category;
  }

  if (minimumImportance !== null) {
    if (!Number.isInteger(minimumImportance)) {
      errors.minimumImportance = "Minimum importance must be an integer.";
    } else if (!isValidImportance(minimumImportance)) {
      errors.minimumImportance =
        "Minimum importance must be between 1 and 5.";
    } else {
      filters.minimumImportance = minimumImportance;
    }
  }

  if (minimumConfidence !== null) {
    if (!isValidConfidence(minimumConfidence)) {
      errors.minimumConfidence =
        "Minimum confidence must be between 0 and 1.";
    } else {
      filters.minimumConfidence = minimumConfidence;
    }
  }

  return {
    errors,
    input: Object.keys(errors).length === 0 ? filters : undefined,
    isValid: Object.keys(errors).length === 0,
  };
}

export function validateCreateMemoryInput(
  body: unknown,
): MemoryValidationResult<CreateMemoryInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const category = readStringField(body, "category");
  const title = readStringField(body, "title");
  const content = readStringField(body, "content");
  const importance = readNumberField(body, "importance");
  const confidence = readNumberField(body, "confidence");
  const sourceConversationId = readOptionalStringField(
    body,
    "sourceConversationId",
  );

  validateRequiredText(errors, "category", category, maxCategoryLength);
  validateRequiredText(errors, "title", title, maxTitleLength);
  validateRequiredText(errors, "content", content, maxContentLength);
  validateRequiredImportance(errors, importance);
  validateRequiredConfidence(errors, confidence);

  if (
    sourceConversationId !== undefined &&
    !uuidPattern.test(sourceConversationId)
  ) {
    errors.sourceConversationId =
      "Source conversation ID must be a valid UUID.";
  }

  if (
    Object.keys(errors).length > 0 ||
    importance === null ||
    confidence === null
  ) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      category,
      confidence,
      content,
      importance,
      sourceConversationId,
      title,
    },
    isValid: true,
  };
}

export function validateUpdateMemoryInput(
  body: unknown,
): MemoryValidationResult<UpdateMemoryInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const input: UpdateMemoryInput = {};

  if ("category" in body) {
    const category = readStringField(body, "category");
    validateRequiredText(errors, "category", category, maxCategoryLength);
    input.category = category;
  }

  if ("title" in body) {
    const title = readStringField(body, "title");
    validateRequiredText(errors, "title", title, maxTitleLength);
    input.title = title;
  }

  if ("content" in body) {
    const content = readStringField(body, "content");
    validateRequiredText(errors, "content", content, maxContentLength);
    input.content = content;
  }

  if ("importance" in body) {
    const importance = readNumberField(body, "importance");
    validateRequiredImportance(errors, importance);
    if (importance !== null) {
      input.importance = importance;
    }
  }

  if ("confidence" in body) {
    const confidence = readNumberField(body, "confidence");
    validateRequiredConfidence(errors, confidence);
    if (confidence !== null) {
      input.confidence = confidence;
    }
  }

  if (Object.keys(input).length === 0) {
    errors.body = "Provide at least one memory field to update.";
  }

  return {
    errors,
    input: Object.keys(errors).length === 0 ? input : undefined,
    isValid: Object.keys(errors).length === 0,
  };
}

function readStringField(body: object, field: string) {
  return field in body && typeof body[field as keyof typeof body] === "string"
    ? String(body[field as keyof typeof body]).trim()
    : "";
}

function readOptionalStringField(body: object, field: string) {
  if (!(field in body) || body[field as keyof typeof body] === null) {
    return undefined;
  }

  return typeof body[field as keyof typeof body] === "string"
    ? String(body[field as keyof typeof body]).trim()
    : "";
}

function readNumberField(body: object, field: string) {
  const value = body[field as keyof typeof body];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeOptionalString(value: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function parseOptionalNumber(value: string | null) {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function validateRequiredText(
  errors: Record<string, string>,
  field: string,
  value: string,
  maxLength: number,
) {
  if (!value) {
    errors[field] = `${fieldToLabel(field)} is required.`;
  } else if (value.length > maxLength) {
    errors[field] = `${fieldToLabel(field)} must be ${maxLength} characters or fewer.`;
  }
}

function validateRequiredImportance(
  errors: Record<string, string>,
  importance: number | null,
) {
  if (importance === null) {
    errors.importance = "Importance is required.";
  } else if (!Number.isInteger(importance)) {
    errors.importance = "Importance must be an integer.";
  } else if (!isValidImportance(importance)) {
    errors.importance = "Importance must be between 1 and 5.";
  }
}

function validateRequiredConfidence(
  errors: Record<string, string>,
  confidence: number | null,
) {
  if (confidence === null) {
    errors.confidence = "Confidence is required.";
  } else if (!isValidConfidence(confidence)) {
    errors.confidence = "Confidence must be between 0 and 1.";
  }
}

function isValidImportance(importance: number) {
  return importance >= 1 && importance <= 5;
}

function isValidConfidence(confidence: number) {
  return confidence >= 0 && confidence <= 1;
}

function fieldToLabel(field: string) {
  return field.charAt(0).toUpperCase() + field.slice(1);
}
