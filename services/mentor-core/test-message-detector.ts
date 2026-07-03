const testMessagePatterns = [
  /\bsmoke test\b/,
  /\btest message\b/,
  /\bdev test\b/,
  /\bfeature [0-9]\b/,
  /\blorem ipsum\b/,
  /\basdf\b/,
  /\bqwerty\b/,
];

export function isDevelopmentTestMessage(message: string) {
  const normalizedMessage = normalizeTestMessage(message);

  if (!normalizedMessage) {
    return false;
  }

  return testMessagePatterns.some((pattern) => pattern.test(normalizedMessage));
}

function normalizeTestMessage(message: string) {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
