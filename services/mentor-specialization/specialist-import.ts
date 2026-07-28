import { readFile } from "node:fs/promises";
import path from "node:path";

export const SPECIALIST_VERSION = "v1";

export const specialistPackDefinitions = [
  { displayName: "Executive Function", mentorSlug: "adhd", slug: "executive-function" },
  { displayName: "Relationship Support", mentorSlug: "relationship", slug: "relationship-support" },
  { displayName: "Stress Recovery", mentorSlug: "stress-burnout", slug: "stress-recovery" },
  { displayName: "Life Direction", mentorSlug: "marcus", slug: "life-direction" },
  { displayName: "Focus & Attention", mentorSlug: "focus", slug: "focus-attention" },
  { displayName: "Confidence Growth", mentorSlug: "confidence", slug: "confidence-growth" },
  { displayName: "Parenting Support", mentorSlug: "parenting", slug: "parenting-support" },
  { displayName: "Health & Fitness", mentorSlug: "health-fitness", slug: "health-fitness" },
] as const;

export interface ParsedSpecialistPack {
  definition: (typeof specialistPackDefinitions)[number];
  description: string;
  evalScenarios: ParsedEvalScenario[];
  knowledgeCards: ParsedKnowledgeCard[];
  safetyRules: ParsedSafetyRule[];
  sources: ParsedSource[];
  sourcePath: string;
  techniques: ParsedTechnique[];
}

export interface ParsedTechnique {
  mentorWording: string;
  priority: number;
  slug: string;
  sourcePath: string;
  steps: string[];
  summary: string;
  tags: string[];
  title: string;
  whenToUse: string;
}

export interface ParsedKnowledgeCard {
  body: string;
  priority: number;
  selectionHints: string[];
  slug: string;
  sourcePath: string;
  sourceRefs: string[];
  summary: string;
  tags: string[];
  title: string;
}

export interface ParsedSource {
  notes: string;
  publisher: string;
  refreshCadence: string;
  slug: string;
  sourcePath: string;
  sourceType: string;
  title: string;
  trustLevel: string;
  url: string | null;
  usage: string;
}

export interface ParsedSafetyRule {
  requiredResponseBehavior: string;
  rule: string;
  severity: "CRISIS" | "HIGH" | "NORMAL";
  slug: string;
  sourcePath: string;
  title: string;
  triggerPatterns: string[];
}

export interface ParsedEvalScenario {
  expectedBehavior: string[];
  mustAvoid: string[];
  mustUse: string[];
  safetyExpectation: string;
  scenarioType: "REGRESSION" | "SAFETY" | "STANDARD";
  slug: string;
  sourcePath: string;
  title: string;
  userPrompt: string;
}

interface Section {
  body: string;
  level: number;
  title: string;
}

export async function parseSpecialistPacks(root = process.cwd()) {
  return Promise.all(
    specialistPackDefinitions.map(async (definition) => {
      const base = `docs/mentor-specialization/${definition.slug}`;
      const files = {
        evals: `${base}-eval-scenarios-v1.md`,
        cards: `${base}-knowledge-cards-v1.md`,
        sources: `${base}-source-registry-v1.md`,
        techniques: `${base}-techniques-v1.md`,
      };
      const [techniquesMarkdown, cardsMarkdown, sourcesMarkdown, evalsMarkdown] =
        await Promise.all(
          [files.techniques, files.cards, files.sources, files.evals].map((file) =>
            readRequiredFile(root, file),
          ),
        );

      const safetyRules = [
        ...parseSafetyRules(techniquesMarkdown, files.techniques),
        ...parseSafetyRules(cardsMarkdown, files.cards),
        ...parseSafetyRules(sourcesMarkdown, files.sources),
      ].filter(
        (rule, index, rules) =>
          rules.findIndex((candidate) => candidate.slug === rule.slug) === index,
      );

      return {
        definition,
        description: firstParagraph(techniquesMarkdown),
        evalScenarios: parseEvalScenarios(evalsMarkdown, files.evals),
        knowledgeCards: parseKnowledgeCards(cardsMarkdown, files.cards),
        safetyRules,
        sourcePath: files.techniques,
        sources: parseSources(sourcesMarkdown, files.sources),
        techniques: parseTechniques(techniquesMarkdown, files.techniques),
      } satisfies ParsedSpecialistPack;
    }),
  );
}

export function parseTechniques(markdown: string, sourcePath: string) {
  return topItemSections(markdown, /^(?:Technique\s+)?\d+/i)
    .map((section, index) => {
      const title = cleanItemTitle(section.title);
      const whenToUse = field(section.body, ["Use when", "When to use"]) || firstParagraph(section.body);
      const summary = field(section.body, ["Goal", "What problem it solves"]) || firstParagraph(section.body);
      const steps = listUnder(section.body, ["Steps", "User steps", "Questions"]);
      return {
        mentorWording: field(section.body, ["Mentor wording", "Example"]) || "",
        priority: 100 - index,
        slug: slugify(title),
        sourcePath,
        steps,
        summary: compact(summary, 600),
        tags: deriveTags(`${title} ${whenToUse} ${summary}`),
        title,
        whenToUse: compact(whenToUse, 500),
      };
    })
    .filter((item) => item.title && item.summary);
}

export function parseKnowledgeCards(markdown: string, sourcePath: string) {
  return topItemSections(markdown, /^(?:Card\s+)?(?:[A-Z]{2}-KC-\d+\s*[:.—-]\s*|\d+\s*[:.—-]\s*)/i)
    .map((section, index) => {
      const title = cleanItemTitle(section.title);
      const summary =
        field(section.body, ["Principle", "Mentor interpretation"]) ||
        firstParagraph(section.body);
      const selectionHints = listUnder(section.body, ["Use when", "Runtime use"]);
      return {
        body: compact(stripMarkdown(section.body), 1200),
        priority: 100 - index,
        selectionHints,
        slug: slugify(title),
        sourcePath,
        sourceRefs: urls(section.body),
        summary: compact(summary, 500),
        tags: deriveTags(`${title} ${summary} ${selectionHints.join(" ")}`),
        title,
      };
    })
    .filter((item) => item.title && item.summary);
}

export function parseSources(markdown: string, sourcePath: string) {
  return sections(markdown)
    .filter((section) => /^(?:Source\s+)?\d+\s*[:.—-]\s*/i.test(section.title) || (section.level === 3 && /^https?:|^[A-Z]/.test(section.body)))
    .map((section) => {
      const title = cleanItemTitle(section.title);
      const body = stripMarkdown(section.body);
      return {
        notes: compact(field(section.body, ["Internal summary"]) || firstParagraph(section.body), 700),
        publisher: title.split(/[:—-]/)[0].trim(),
        refreshCadence: field(section.body, ["Refresh interval", "Refresh cadence"]) || "manual review",
        slug: slugify(title),
        sourcePath,
        sourceType: field(section.body, ["Authority", "Type"]) || "curated reference",
        title,
        trustLevel: /official|government|public health|research institute/i.test(body) ? "high" : "curated",
        url: urls(section.body)[0] ?? null,
        usage: listUnder(section.body, ["Use for", "Use"]).join("; ") || compact(body, 500),
      };
    })
    .filter((item) => item.title);
}

export function parseSafetyRules(markdown: string, sourcePath: string) {
  return sections(markdown)
    .filter((section) => /safety|boundar/i.test(section.title))
    .flatMap((section) => {
      const rules = bulletLines(section.body);
      return (rules.length ? rules : [firstParagraph(section.body)])
        .filter(Boolean)
        .map((rule, index) => {
          const severity = /suicid|self-harm|immediate danger|emergency|abuse|violence|child safety/i.test(rule)
            ? "CRISIS"
            : /diagnos|medical|medication|eating disorder|injury|legal|manipulat|fasting/i.test(rule)
              ? "HIGH"
              : "NORMAL";
          const title = `${cleanItemTitle(section.title)} ${index + 1}`;
          return {
            requiredResponseBehavior:
              severity === "CRISIS"
                ? "Stop ordinary mentoring and encourage immediate qualified local human or emergency support."
                : "Keep the response within mentoring scope, avoid overclaiming, and direct professional decisions to qualified people.",
            rule: compact(stripMarkdown(rule), 700),
            severity,
            slug: slugify(title),
            sourcePath,
            title,
            triggerPatterns: deriveTags(rule),
          } satisfies ParsedSafetyRule;
        });
    });
}

export function parseEvalScenarios(markdown: string, sourcePath: string) {
  return sections(markdown)
    .filter(
      (section) =>
        /^(?:(?:Regression\s+)?Scenario\s+)?\d+\s*[:.—-]/i.test(section.title) &&
        /^(?:#{3,4}\s+)?(?:User )?Prompt(?::|\s*$)/im.test(section.body),
    )
    .map((section) => {
      const title = cleanItemTitle(
        section.title.replace(
          /^(?:Regression\s+)?(?:Scenario\s+)?\d+\s*[:.—-]\s*/i,
          "",
        ),
      );
      const regression = /^Regression/i.test(section.title);
      const safety = regression || /safety|diagnos|distress|abuse|violence|injury|fast|medication|child/i.test(`${title} ${section.body}`);
      return {
        expectedBehavior: listUnder(section.body, ["Expected specialist behavior", "Expected mentor behavior", "Expected behavior", "Pass conditions"]),
        mustAvoid: listUnder(section.body, ["Failure modes", "Must avoid"]),
        mustUse: listUnder(section.body, ["Good answer should include", "Must use"]),
        safetyExpectation: safety ? "Apply the pack safety boundary before ordinary coaching." : "",
        scenarioType: regression ? "REGRESSION" : safety ? "SAFETY" : "STANDARD",
        slug: slugify(`${regression ? "regression-" : ""}${title}`),
        sourcePath,
        title,
        userPrompt:
          blockquoteUnder(section.body, "User prompt") ||
          field(section.body, ["User prompt", "Prompt"]).replace(/^["“]|["”]$/g, ""),
      } satisfies ParsedEvalScenario;
    })
    .filter((item) => item.title && item.userPrompt);
}

function sections(markdown: string): Section[] {
  const matches = [...markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)];
  return matches.map((match, index) => ({
    body: markdown
      .slice(
        (match.index ?? 0) + match[0].length,
        matches
          .slice(index + 1)
          .find((candidate) => candidate[1].length <= match[1].length)?.index ??
          markdown.length,
      )
      .trim(),
    level: match[1].length,
    title: match[2].trim(),
  }));
}

function topItemSections(markdown: string, pattern: RegExp) {
  return sections(markdown).filter((section) => section.level === 2 && pattern.test(section.title));
}

function cleanItemTitle(title: string) {
  return title
    .replace(/^(?:Technique|Card|Source)\s+(?:[A-Z]{2}-KC-)?\d+\s*[:.—-]\s*/i, "")
    .replace(/^\d+\.\s*/, "")
    .trim();
}

function field(body: string, names: string[]) {
  for (const name of names) {
    const heading = new RegExp(`^#{3,4}\\s+${escapeRegExp(name)}\\s*$`, "im");
    const headingMatch = heading.exec(body);
    if (headingMatch?.index !== undefined) {
      return body.slice(headingMatch.index + headingMatch[0].length).split(/^#{3,4}\s+/m)[0].trim();
    }
    const inline = new RegExp(`^${escapeRegExp(name)}:\\s*([\\s\\S]*?)(?=\\n(?:[A-Z][^\\n]{0,40}:|#{2,4}\\s)|$)`, "im").exec(body);
    if (inline) return inline[1].trim();
  }
  return "";
}

function listUnder(body: string, names: string[]) {
  return bulletLines(field(body, names));
}

function blockquoteUnder(body: string, name: string) {
  return field(body, [name])
    .split("\n")
    .filter((line) => line.trim().startsWith(">"))
    .map((line) => line.replace(/^\s*>\s?/, ""))
    .join("\n")
    .trim();
}

function bulletLines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter((line) => /^[-*] |\d+\. /.test(line)).map((line) => line.replace(/^[-*]\s+|^\d+\.\s+/, "").trim());
}

function firstParagraph(value: string) {
  return stripMarkdown(value).split(/\n\s*\n/).find((part) => part.trim())?.trim() ?? "";
}

function stripMarkdown(value: string) {
  return value.replace(/^#{1,6}\s+/gm, "").replace(/^>\s?/gm, "").replace(/\*\*/g, "").trim();
}

function compact(value: string, max: number) {
  const normalized = stripMarkdown(value).replace(/\s+/g, " ").trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1).trim()}…`;
}

function urls(value: string) {
  return [...value.matchAll(/https?:\/\/[^\s)>]+/g)].map((match) => match[0].replace(/[.,]$/, ""));
}

function deriveTags(value: string) {
  const stop = new Set(["about", "after", "before", "could", "should", "their", "there", "these", "they", "this", "those", "under", "user", "when", "where", "which", "with", "would"]);
  return [...new Set(value.toLowerCase().match(/[a-z][a-z-]{3,}/g)?.filter((word) => !stop.has(word)) ?? [])].slice(0, 20);
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

async function readRequiredFile(root: string, sourcePath: string) {
  try {
    return await readFile(path.join(root, sourcePath), "utf8");
  } catch (error) {
    throw new Error(`Required specialist pack file is missing: ${sourcePath}`, { cause: error });
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
