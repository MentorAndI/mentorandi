export const developmentTestMessageSearchTerms = [
  "smoke test",
  "test message",
  "dev test",
  "feature 0",
  "feature 1",
  "feature 2",
  "feature 3",
  "feature 4",
  "feature 5",
  "feature 6",
  "feature 7",
  "feature 8",
  "feature 9",
  "lorem ipsum",
  "asdf",
  "qwerty",
];

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
